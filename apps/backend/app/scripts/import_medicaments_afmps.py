import os
import re
import unicodedata
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import pandas as pd
import requests
import tempfile
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
    """Extrait le nom du médicament et la dose (uniquement les chiffres)"""
    name = "" if name is None else str(name)
    # Fixed regex to prevent ReDoS attacks by using non-overlapping pattern matching
    m = re.search(
        r"\b\d+(?:[.,]\d+)?(?:\s*[.,/-]\s*\d+(?:[.,]\d+)?)?\s*(?:mg|µg|ug|mcg|u|ui|ml|g|%|mmol)(?:/\d+(?:[.,]\d+)?\s*ml)?\b",
        name,
        re.IGNORECASE,
    )
    if m:
        dose_full = m.group().strip()
        # Extraire uniquement les chiffres (et décimales)
        dose_numbers = re.findall(r"\d+(?:[.,]\d+)?", dose_full)
        dose = dose_numbers[0] if dose_numbers else ""
        # Normaliser le séparateur décimal (virgule -> point)
        dose = dose.replace(",", ".") if dose else ""
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


def download_afmps_csv(url: str = "https://basededonneesdesmedicaments.be/download/human/packs") -> str:
    """Télécharge le fichier CSV AFMPS et retourne le chemin du fichier temporaire"""
    print(f"Téléchargement du fichier depuis {url}...")
    
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        
        # Créer un fichier temporaire
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8')
        temp_file.write(response.text)
        temp_file.close()
        
        print(f"✓ Fichier téléchargé: {temp_file.name} ({len(response.text)} caractères)")
        return temp_file.name
        
    except requests.RequestException as e:
        raise Exception(f"Erreur lors du téléchargement du fichier CSV: {e}")


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


def deduplicate_by_fmd(df_sql: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, int]]:
    """Déduplique les lignes avec FMD et sépare celles sans FMD"""
    stats = {
        "total_rows": len(df_sql),
        "rows_without_fmd": 0,
        "duplicate_fmd": 0,
        "unique_fmd": 0
    }
    
    # Séparer les lignes avec et sans code_fmd
    df_with_fmd = df_sql[df_sql["code_fmd"].notna() & (df_sql["code_fmd"] != "")].copy()
    df_without_fmd = df_sql[df_sql["code_fmd"].isna() | (df_sql["code_fmd"] == "")].copy()
    
    stats["rows_without_fmd"] = len(df_without_fmd)
    
    # Dédupliquer par code_fmd (garde la dernière occurrence)
    initial_count = len(df_with_fmd)
    df_deduped = df_with_fmd.drop_duplicates(subset=["code_fmd"], keep="last")
    
    stats["duplicate_fmd"] = initial_count - len(df_deduped)
    stats["unique_fmd"] = len(df_deduped)
    
    return df_deduped, df_without_fmd, stats


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


def insert_data_without_fmd(df_sql: pd.DataFrame, table_name: str,
                           columns_sql: list, chunk_size: int) -> int:
    """Insère les données sans code_fmd (INSERT simple)"""
    total = len(df_sql)
    if total == 0:
        return 0
    
    processed = 0

    # Créer les identifiants SQL
    schema_table = table_name.split('.')
    if len(schema_table) == 2:
        table_identifier = sql.Identifier(schema_table[0], schema_table[1])
    else:
        table_identifier = sql.Identifier(table_name)

    # Template INSERT simple
    insert_template = sql.SQL(
        "INSERT INTO {} ({}) VALUES %s"
    ).format(
        table_identifier,
        sql.SQL(", ").join(map(sql.Identifier, columns_sql))
    )

    # SCRIPT ADMIN: skip_rls=True
    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cur:
            for start in range(0, total, chunk_size):
                chunk = df_sql.iloc[start:start+chunk_size]
                records = [row_to_tuple(r, columns_sql) for _, r in chunk.iterrows()]
                
                if records:
                    execute_values(cur, insert_template, records)
                    processed += len(records)
                    print(f"Traité {processed} lignes sans FMD sur {total}...")
            
            conn.commit()

    return processed


def upsert_data_chunks(df_sql: pd.DataFrame, table_name: str,
                      columns_sql: list, chunk_size: int) -> Dict[str, int]:
    """Insère ou met à jour les données par chunks avec UPSERT basé sur code_fmd"""
    total = len(df_sql)
    stats = {"inserted": 0, "updated": 0, "total_processed": 0}

    # Créer les identifiants SQL
    schema_table = table_name.split('.')
    if len(schema_table) == 2:
        table_identifier = sql.Identifier(schema_table[0], schema_table[1])
    else:
        table_identifier = sql.Identifier(table_name)

    # Colonnes à mettre à jour (toutes sauf code_fmd qui est la clé)
    update_cols = [c for c in columns_sql if c != "code_fmd"]

    # Template UPSERT avec WHERE pour supporter l'index partiel
    upsert_template = sql.SQL(
        "INSERT INTO {} ({}) VALUES %s "
        "ON CONFLICT (code_fmd) WHERE code_fmd IS NOT NULL DO UPDATE SET {}"
    ).format(
        table_identifier,
        sql.SQL(", ").join(map(sql.Identifier, columns_sql)),
        sql.SQL(", ").join(
            sql.SQL("{} = EXCLUDED.{}").format(sql.Identifier(c), sql.Identifier(c))
            for c in update_cols
        )
    )

    # SCRIPT ADMIN: skip_rls=True
    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cur:
            for start in range(0, total, chunk_size):
                chunk = df_sql.iloc[start:start+chunk_size]
                records = [row_to_tuple(r, columns_sql) for _, r in chunk.iterrows()]
                
                if records:
                    execute_values(cur, upsert_template, records)
                    stats["total_processed"] += len(records)
                    print(f"Traité {stats['total_processed']} lignes sur {total}...")
            
            conn.commit()

    # Impossible de distinguer INSERT vs UPDATE avec execute_values, on compte tout
    stats["inserted"] = stats["total_processed"]
    return stats


def import_afmps_to_bis(
    csv_path: Optional[str] = None,
    table_name: str = "public.medicaments_afmps",
    sep: Optional[str] = None,
    chunk_size: int = 5000,
    auto_download: bool = True,
) -> Dict[str, Any]:
    """
    Importe un fichier AFMPS (CSV) dans la table public.bis_medicaments_afmps.
    
    Args:
        csv_path: Chemin vers le fichier CSV local (optionnel si auto_download=True)
        table_name: Nom de la table cible
        sep: Séparateur CSV (détecté automatiquement si None)
        chunk_size: Taille des chunks pour l'import
        auto_download: Si True et csv_path est None, télécharge depuis l'URL AFMPS
    
    Utilise un UPSERT basé sur code_fmd pour mettre à jour les données existantes.
    Filtre les doublons et les lignes sans code_fmd.
    """
    temp_file_to_cleanup = None
    
    # Téléchargement automatique si aucun fichier n'est fourni
    if csv_path is None and auto_download:
        csv_path = download_afmps_csv()
        temp_file_to_cleanup = csv_path
    elif csv_path is None:
        raise ValueError("csv_path doit être fourni ou auto_download doit être True")
    
    print(f"\n{'='*60}")
    print(f"Import AFMPS: {csv_path}")
    print(f"Table cible: {table_name}")
    print(f"{'='*60}\n")

    # Validation sécurité
    if not validate_table_name(table_name):
        raise ValueError(f"Nom de table invalide : {table_name}")

    # Détection automatique du séparateur
    if sep is None:
        sep = detect_csv_separator(csv_path)
        print(f"Séparateur détecté: '{sep}'")

    # Lecture et préparation du CSV
    print("Lecture du fichier CSV...")
    df = pd.read_csv(csv_path, sep=sep, encoding="utf-8", dtype=str)
    print(f"✓ {len(df)} lignes lues depuis le CSV")
    
    df = prepare_dataframe(df)
    df_sql, columns_sql = map_csv_to_sql_columns(df)

    # Déduplication par code_fmd
    print("\nDéduplication des données...")
    df_with_fmd, df_without_fmd, dedup_stats = deduplicate_by_fmd(df_sql)
    
    print(f"✓ Lignes totales: {dedup_stats['total_rows']}")
    print(f"✓ Lignes sans code FMD: {dedup_stats['rows_without_fmd']}")
    print(f"✓ Doublons FMD (supprimés): {dedup_stats['duplicate_fmd']}")
    print(f"✓ Codes FMD uniques à importer: {dedup_stats['unique_fmd']}")

    total_processed = 0

    # UPSERT des données avec FMD
    if len(df_with_fmd) > 0:
        print(f"\nImport des données avec FMD (UPSERT)...")
        upsert_stats = upsert_data_chunks(df_with_fmd, table_name, columns_sql, chunk_size)
        total_processed += upsert_stats['total_processed']
    else:
        print("\n⚠ Aucune donnée avec code FMD.")

    # INSERT des données sans FMD
    if len(df_without_fmd) > 0:
        print(f"\nImport des données sans FMD (INSERT)...")
        inserted_without_fmd = insert_data_without_fmd(df_without_fmd, table_name, columns_sql, chunk_size)
        total_processed += inserted_without_fmd
    else:
        inserted_without_fmd = 0

    # Résumé final
    abs_path = os.path.abspath(csv_path)
    print(f"\n{'='*60}")
    print(f"✓ Import terminé avec succès!")
    print(f"  - Lignes totales traitées: {total_processed}")
    print(f"  - Avec FMD (UPSERT): {dedup_stats['unique_fmd']}")
    print(f"  - Sans FMD (INSERT): {inserted_without_fmd}")
    print(f"  - Doublons supprimés: {dedup_stats['duplicate_fmd']}")
    print(f"{'='*60}\n")

    result = {
        "table": table_name,
        "path": abs_path,
        "rows_read": len(df),
        "rows_with_fmd": dedup_stats['unique_fmd'],
        "rows_without_fmd": inserted_without_fmd,
        "duplicates_removed": dedup_stats['duplicate_fmd'],
        "rows_processed": total_processed,
        "separator_used": sep,
    }
    
    # Nettoyage du fichier temporaire si téléchargé
    if temp_file_to_cleanup:
        try:
            os.unlink(temp_file_to_cleanup)
            print("Fichier temporaire supprimé.")
        except Exception as e:
            print(f"Avertissement: impossible de supprimer le fichier temporaire: {e}")
    
    return result
