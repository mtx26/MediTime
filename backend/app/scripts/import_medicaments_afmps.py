import os
import re
import unicodedata
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import pandas as pd
from psycopg2.extras import execute_values
from psycopg2 import sql
from app.db.connection import get_connection


def validate_table_name(table_name: str) -> bool:
    """Valide le nom de table pour éviter les injections SQL"""
    # Autorise seulement les noms de table avec schema.table ou table
    # Caractères autorisés : lettres, chiffres, underscores, points
    pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$'
    return bool(re.match(pattern, table_name))


def deaccent(s: str) -> str:
    """Supprime les accents d'une chaîne"""
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def to_snake(s: str) -> str:
    """Convertit une chaîne en snake_case"""
    s = deaccent(s).lower().strip()
    s = s.replace("'", "'")
    s = s.replace("/", " ")
    s = re.sub(r"[^a-z0-9\s_]", " ", s)
    s = re.sub(r"\s+", "_", s).strip("_")
    return s


def extract_name_and_dose(name: str) -> Tuple[str, str]:
    """Extrait le nom du médicament et la dose"""
    name = "" if name is None else str(name)
    # Fixed regex to prevent ReDoS attacks by using non-overlapping pattern matching
    m = re.search(
        r"\b\d+(?:[.,]\d+)?(?:\s*[.,/-]\s*\d+(?:[.,]\d+)?)?\s*(?:mg|µg|ug|mcg|u|ui|ml|g|%|mmol)(?:/\d+(?:[.,]\d+)?\s*ml)?\b",
        name,
        re.IGNORECASE,
    )
    if m:
        dose = m.group().strip()
        med_name = name[: m.start()].strip().strip("-_/")
        return med_name, dose
    return name.strip(), ""


def parse_date_like(s: str) -> Optional[str]:
    """Parse une date dans différents formats"""
    s = ("" if s is None else str(s)).strip()
    if not s:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def clean_code_fmd(val: str) -> str:
    """Retire les guillemets et nettoie le code FMD"""
    if not val:
        return None
    val = str(val).strip()
    # supprime guillemets et caractères de contrôle GS1 (ASCII 29)
    val = val.replace('"', "").replace("'", "").replace("\x1D", "")
    return val if val else None


def detect_csv_separator(csv_path: str) -> str:
    """Détecte automatiquement le séparateur CSV"""
    with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
        head = f.read(4096)
        return ";" if head.count(";") >= head.count(",") else ","


def prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Prépare et nettoie le DataFrame"""
    df.columns = [to_snake(c) for c in df.columns]

    # extraction name/dose
    if "nom" in df.columns:
        df[["medicament_name", "dose"]] = df["nom"].fillna("").apply(
            lambda x: pd.Series(extract_name_and_dose(x))
        )
    else:
        df["medicament_name"] = ""
        df["dose"] = ""

    return df


def get_column_mappings() -> Tuple[Dict[str, str], list]:
    """Retourne les mappings CSV vers SQL et la liste des colonnes SQL"""
    csv_to_sql = {
        "medicament_name": "name",
        "dose": "dose",
        "forme_pharmaceutique": "forme_pharmaceutique",
        "voie_d_administration": "voie_administration",
        "voie_d'administration": "voie_administration",
        "conditionnement": "conditionnement",
        "substance_active": "substance_active",
        "code_atc": "code_atc",
        "code_cnk": "code_cnk",
        "code_fmd": "code_fmd",
        "url_notice_fr": "url_notice_fr",
        "url_notice_nl": "url_notice_nl",
        "url_notice_de": "url_notice_de",
        "url_rcp": "url_rcp",
        "url_summary_rmp_fr": "url_summary_rmp_fr",
        "url_summary_rmp_nl": "url_summary_rmp_nl",
        "url_summary_rmp_de": "url_summary_rmp_de",
        "date_de_derniere_publication_rcp_notice": "date_derniere_publication_rcp_notice",
        "date_de_derniere_approbation_rcp_notice": "date_derniere_approbation_rcp_notice",
    }

    columns_sql = [
        "name", "dose", "forme_pharmaceutique", "voie_administration", "conditionnement",
        "substance_active", "code_atc", "code_cnk", "code_fmd",
        "url_notice_fr", "url_notice_nl", "url_notice_de",
        "url_rcp", "url_summary_rmp_fr", "url_summary_rmp_nl", "url_summary_rmp_de",
        "date_derniere_publication_rcp_notice", "date_derniere_approbation_rcp_notice",
    ]

    return csv_to_sql, columns_sql


def map_csv_to_sql_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, list]:
    """Mappe les colonnes CSV aux colonnes SQL"""
    csv_to_sql, columns_sql = get_column_mappings()

    # construit DF aligné
    data = {}
    for csv_col_norm, sql_col in csv_to_sql.items():
        if csv_col_norm in df.columns:
            data[sql_col] = df[csv_col_norm].fillna("").astype(str).str.strip()
        else:
            data[sql_col] = ""

    df_sql = pd.DataFrame({col: data[col] for col in columns_sql})

    # parse dates
    date_columns = ("date_derniere_publication_rcp_notice", "date_derniere_approbation_rcp_notice")
    for dcol in date_columns:
        df_sql[dcol] = df_sql[dcol].apply(parse_date_like)

    # nettoyer code_fmd
    if "code_fmd" in df_sql.columns:
        df_sql["code_fmd"] = df_sql["code_fmd"].apply(clean_code_fmd)

    return df_sql, columns_sql


def create_sql_identifiers(table_name: str, columns_sql: list) -> Tuple[sql.Composable, sql.Composable]:
    """Crée les identifiants SQL sécurisés"""
    schema_table = table_name.split('.')
    if len(schema_table) == 2:
        table_identifier = sql.Identifier(schema_table[0], schema_table[1])
    else:
        table_identifier = sql.Identifier(table_name)

    insert_sql_template = sql.SQL("INSERT INTO {} ({}) VALUES %s").format(
        table_identifier,
        sql.SQL(", ").join(map(sql.Identifier, columns_sql))
    )

    return table_identifier, insert_sql_template


def row_to_tuple(row, columns_sql: list) -> tuple:
    """Convertit une ligne DataFrame en tuple pour l'insertion"""
    vals = []
    for col in columns_sql:
        v = row[col]
        if isinstance(v, float) and pd.isna(v):
            v = None
        if isinstance(v, str) and v == "":
            v = None
        vals.append(v)
    return tuple(vals)


def clear_existing_data(table_identifier: sql.Composable) -> None:
    """Supprime les données existantes de la table"""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("DELETE FROM {}").format(table_identifier)
            )
            conn.commit()


def insert_data_chunks(df_sql: pd.DataFrame, insert_sql_template: sql.Composable,
                      columns_sql: list, chunk_size: int) -> int:
    """Insère les données par chunks"""
    total = len(df_sql)
    inserted = 0

    with get_connection() as conn:
        with conn.cursor() as cur:
            print("Deleted existing rows in the table.")

            for start in range(0, total, chunk_size):
                chunk = df_sql.iloc[start:start+chunk_size]
                records = [row_to_tuple(r, columns_sql) for _, r in chunk.iterrows()]
                if records:
                    execute_values(cur, insert_sql_template, records)
                    inserted += len(records)

                print(f"Inserted {inserted} rows so far...")
        conn.commit()

    return inserted


def import_afmps_to_bis(
    csv_path: str,
    table_name: str = "public.bis_medicaments_afmps",
    sep: Optional[str] = None,
    chunk_size: int = 5000,
) -> Dict[str, Any]:
    """
    Importe un fichier AFMPS (CSV) dans la table public.bis_medicaments_afmps.

    Nettoie accents, aligne colonnes, parse dates, retire les guillemets de code_fmd.
    """
    print(f"Importing AFMPS data from {csv_path} into {table_name}...")

    # Validation sécurité
    if not validate_table_name(table_name):
        raise ValueError(f"Nom de table invalide : {table_name}")

    # Détection automatique du séparateur
    if sep is None:
        sep = detect_csv_separator(csv_path)

    # Lecture et préparation du CSV
    df = pd.read_csv(csv_path, sep=sep, encoding="utf-8", dtype=str)
    df = prepare_dataframe(df)
    df_sql, columns_sql = map_csv_to_sql_columns(df)

    # Création des identifiants SQL sécurisés
    table_identifier, insert_sql_template = create_sql_identifiers(table_name, columns_sql)

    # Suppression des données existantes
    clear_existing_data(table_identifier)

    # Insertion des nouvelles données
    total = len(df_sql)
    inserted = insert_data_chunks(df_sql, insert_sql_template, columns_sql, chunk_size)

    # Message de fin sécurisé
    abs_path = os.path.abspath(csv_path)
    print(f"Importé {inserted} lignes sur {total} lues depuis le fichier CSV")

    return {
        "table": table_name,
        "path": abs_path,
        "rows_read": total,
        "rows_inserted": inserted,
        "separator_used": sep,
    }
