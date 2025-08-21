import os
import re
import unicodedata
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

import pandas as pd
from psycopg2.extras import execute_values
from app.db.connection import get_connection


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

    # ---------- utils ----------
    def deaccent(s: str) -> str:
        return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))

    def to_snake(s: str) -> str:
        s = deaccent(s).lower().strip()
        s = s.replace("’", "'")
        s = s.replace("/", " ")
        s = re.sub(r"[^a-z0-9\s_]", " ", s)
        s = re.sub(r"\s+", "_", s).strip("_")
        return s

    def extract_name_and_dose(name: str) -> Tuple[str, str]:
        name = "" if name is None else str(name)
        m = re.search(
            r"\b\d[\d\s.,/-]*\s*(mg|µg|ug|mcg|u|ui|ml|g|%|mmol)(/[0-9.,\s]*ml)?\b",
            name,
            re.IGNORECASE,
        )
        if m:
            dose = m.group().strip()
            med_name = name[: m.start()].strip().strip("-_/")
            return med_name, dose
        return name.strip(), ""

    def parse_date_like(s: str) -> Optional[str]:
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

    # ---------- lecture CSV ----------
    if sep is None:
        with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
            head = f.read(4096)
            sep = ";" if head.count(";") >= head.count(",") else ","

    df = pd.read_csv(csv_path, sep=sep, encoding="utf-8", dtype=str)
    df.columns = [to_snake(c) for c in df.columns]

    # extraction name/dose
    if "nom" in df.columns:
        df[["medicament_name", "dose"]] = df["nom"].fillna("").apply(
            lambda x: pd.Series(extract_name_and_dose(x))
        )
    else:
        df["medicament_name"] = ""
        df["dose"] = ""

    # mapping CSV -> SQL
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

    # construit DF aligné
    data = {}
    for csv_col_norm, sql_col in csv_to_sql.items():
        if csv_col_norm in df.columns:
            data[sql_col] = df[csv_col_norm].fillna("").astype(str).str.strip()
        else:
            data[sql_col] = ""

    df_sql = pd.DataFrame({col: data[col] for col in columns_sql})

    # parse dates
    for dcol in ("date_derniere_publication_rcp_notice", "date_derniere_approbation_rcp_notice"):
        df_sql[dcol] = df_sql[dcol].apply(parse_date_like)

    # nettoyer code_fmd
    if "code_fmd" in df_sql.columns:
        df_sql["code_fmd"] = df_sql["code_fmd"].apply(clean_code_fmd)

    # ---------- insertion ----------
    total = len(df_sql)
    inserted = 0
    insert_sql = f"""
        INSERT INTO {table_name} ({", ".join(columns_sql)})
        VALUES %s
    """

    def row_to_tuple(row):
        vals = []
        for col in columns_sql:
            v = row[col]
            if isinstance(v, float) and pd.isna(v):
                v = None
            if isinstance(v, str) and v == "":
                v = None
            vals.append(v)
        return tuple(vals)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(f"DELETE FROM {table_name};")
            conn.commit()
            
    with get_connection() as conn:
        with conn.cursor() as cur:
            print("Deleted existing rows in the table.")
            
            for start in range(0, total, chunk_size):
                chunk = df_sql.iloc[start:start+chunk_size]
                records = [row_to_tuple(r) for _, r in chunk.iterrows()]
                if records:
                    execute_values(cur, insert_sql, records)
                    inserted += len(records)
                
                print(f"Inserted {inserted} rows so far...")
        conn.commit()

    print(f"Importé {inserted} lignes sur {total} lues depuis {csv_path} dans {table_name}")

    return {
        "table": table_name,
        "path": os.path.abspath(csv_path),
        "rows_read": total,
        "rows_inserted": inserted,
        "separator_used": sep,
    }
