import os
import re
import tempfile
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import pandas as pd
import requests
from psycopg2.extras import execute_values
from psycopg2 import sql
from app.db.connection import get_connection


def validate_table_name(table_name: str) -> bool:
    """Valide le nom de table pour éviter les injections SQL"""
    pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$'
    return bool(re.match(pattern, table_name))


def download_france_file(filename: str) -> str:
    """Télécharge un fichier BDPM France et retourne le chemin temporaire"""
    url = f"https://base-donnees-publique.medicaments.gouv.fr/download/file/{filename}"
    print(f"Téléchargement {filename}...")
    
    try:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        
        # Créer un fichier temporaire
        temp_file = tempfile.NamedTemporaryFile(
            mode='wb', 
            suffix='.txt', 
            delete=False
        )
        temp_file.write(response.content)
        temp_file.close()
        
        print(f"✓ {filename} téléchargé: {temp_file.name}")
        return temp_file.name
        
    except requests.RequestException as e:
        raise Exception(f"Erreur téléchargement {filename}: {e}")


def extract_dose_from_text(text: str) -> str:
    """Extrait la dose numérique d'un texte"""
    if not text:
        return ""
    
    # Chercher un nombre avec décimales
    match = re.search(r'\d+(?:[.,]\d+)?', str(text))
    if match:
        dose = match.group().replace(',', '.')
        return dose
    return ""


def load_france_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Télécharge et charge les 3 fichiers BDPM France"""
    
    # Télécharger les fichiers
    cis_file = download_france_file("CIS_bdpm.txt")
    cip_file = download_france_file("CIS_CIP_bdpm.txt")
    compo_file = download_france_file("CIS_COMPO_bdpm.txt")
    
    print("\nChargement des fichiers...")

    # Charger CIS (spécialités)
    df_cis = pd.read_csv(
        cis_file,
        sep='\t',
        encoding='ISO-8859-1',
        dtype=str,
        header=None
    )
    # Colonnes: 0=cis, 1=nom, 2=forme, 3=voies_admin, ...
    df_cis.columns = [f'col_{i}' for i in range(len(df_cis.columns))]
    df_cis = df_cis.rename(columns={
        'col_0': 'cis',
        'col_1': 'nom',
        'col_2': 'forme',
        'col_3': 'voies_admin'
    })
    print(f"✓ CIS: {len(df_cis)} spécialités")
    
    # Charger CIP (présentations/conditionnements)
    df_cip = pd.read_csv(
        cip_file,
        sep='\t',
        encoding='ISO-8859-1',
        dtype=str,
        header=None
    )
    # Les colonnes importantes sont: 0=cis, 1=cip7, 2=libelle_pres, 6=cip13
    df_cip.columns = [f'col_{i}' for i in range(len(df_cip.columns))]
    df_cip = df_cip.rename(columns={
        'col_0': 'cis',
        'col_1': 'cip7',
        'col_2': 'libelle_pres',
        'col_6': 'cip13'
    })
    print(f"✓ CIP: {len(df_cip)} présentations")
    
    # Charger COMPO (compositions)
    df_compo = pd.read_csv(
        compo_file,
        sep='\t',
        encoding='ISO-8859-1',
        dtype=str,
        header=None
    )
    # Colonnes: 0=cis, 3=nom_subst, 4=dosage, 6=nature, ...
    df_compo.columns = [f'col_{i}' for i in range(len(df_compo.columns))]
    df_compo = df_compo.rename(columns={
        'col_0': 'cis',
        'col_3': 'nom_subst',
        'col_4': 'dosage',
        'col_6': 'nature'
    })
    # Garder uniquement les principes actifs (SA)
    df_compo = df_compo[df_compo['nature'] == 'SA'].copy()
    print(f"✓ COMPO: {len(df_compo)} compositions")
    
    # Nettoyer les fichiers temporaires
    for f in [cis_file, cip_file, compo_file]:
        try:
            os.unlink(f)
        except:
            pass
    
    return df_cis, df_cip, df_compo


def join_france_data(df_cis: pd.DataFrame, df_cip: pd.DataFrame, 
                     df_compo: pd.DataFrame) -> pd.DataFrame:
    """Joint les 3 DataFrames pour créer un dataset unifié"""
    
    print("\nJointure des données...")
    
    # Grouper les compositions par CIS (plusieurs substances par médicament)
    df_compo_grouped = df_compo.groupby('cis').agg({
        'nom_subst': lambda x: ' / '.join(x.dropna().unique()),
        'dosage': lambda x: ' / '.join(x.dropna().astype(str).unique())
    }).reset_index()
    
    df_compo_grouped.columns = ['cis', 'substance_active', 'dosage_compo']
    
    # Joindre CIS + CIP
    df_merged = df_cip.merge(df_cis, on='cis', how='left', suffixes=('_cip', '_cis'))
    
    # Joindre avec compositions
    df_merged = df_merged.merge(df_compo_grouped, on='cis', how='left')
    
    print(f"✓ {len(df_merged)} lignes après jointure")
    
    return df_merged


def prepare_france_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Prépare le DataFrame France au format de la base"""
    
    print("\nPréparation des données...")
    
    # Créer les colonnes au format attendu
    df_clean = pd.DataFrame()
    
    df_clean['name'] = df['nom'].fillna('')
    df_clean['dose'] = df['dosage_compo'].fillna('').apply(extract_dose_from_text)
    df_clean['forme_pharmaceutique'] = df['forme'].fillna('')
    df_clean['voie_administration'] = df['voies_admin'].fillna('')
    df_clean['conditionnement'] = df['libelle_pres'].fillna('')
    df_clean['substance_active'] = df['substance_active'].fillna('')
    df_clean['code_atc'] = ''  # Pas dans les fichiers de base
    df_clean['code_cnk'] = df['cip7'].fillna('')
    df_clean['code_fmd'] = df['cip13'].fillna('')  # CIP13 = code unique
    
    # URLs vides pour la France
    for col in ['url_notice_fr', 'url_notice_nl', 'url_notice_de', 
                'url_rcp', 'url_summary_rmp_fr', 'url_summary_rmp_nl', 'url_summary_rmp_de']:
        df_clean[col] = None
    
    # Dates
    df_clean['date_derniere_publication_rcp_notice'] = None
    df_clean['date_derniere_approbation_rcp_notice'] = None
    
    # Nettoyer les valeurs vides
    df_clean = df_clean.fillna('')
    
    return df_clean


def deduplicate_by_code(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, int]]:
    """Déduplique par code_fmd (CIP13)"""
    stats = {
        "total_rows": len(df),
        "rows_without_code": 0,
        "duplicate_code": 0,
        "unique_code": 0
    }
    
    df_with_code = df[df["code_fmd"].notna() & (df["code_fmd"] != "")].copy()
    df_without_code = df[df["code_fmd"].isna() | (df["code_fmd"] == "")].copy()
    
    stats["rows_without_code"] = len(df_without_code)
    
    initial_count = len(df_with_code)
    df_deduped = df_with_code.drop_duplicates(subset=["code_fmd"], keep="last")
    
    stats["duplicate_code"] = initial_count - len(df_deduped)
    stats["unique_code"] = len(df_deduped)
    
    return df_deduped, df_without_code, stats


def row_to_tuple(row, columns: list) -> tuple:
    """Convertit une ligne en tuple"""
    vals = []
    for col in columns:
        v = row[col]
        if isinstance(v, float) and pd.isna(v):
            v = None
        if isinstance(v, str) and v == "":
            v = None
        vals.append(v)
    return tuple(vals)


def upsert_data_chunks(df: pd.DataFrame, table_name: str, 
                      columns: list, chunk_size: int) -> Dict[str, int]:
    """Insère ou met à jour les données par chunks"""
    total = len(df)
    stats = {"inserted": 0, "updated": 0, "total_processed": 0}

    schema_table = table_name.split('.')
    if len(schema_table) == 2:
        table_identifier = sql.Identifier(schema_table[0], schema_table[1])
    else:
        table_identifier = sql.Identifier(table_name)

    update_cols = [c for c in columns if c != "code_fmd"]

    upsert_template = sql.SQL(
        "INSERT INTO {} ({}) VALUES %s "
        "ON CONFLICT (code_fmd) WHERE code_fmd IS NOT NULL DO UPDATE SET {}"
    ).format(
        table_identifier,
        sql.SQL(", ").join(map(sql.Identifier, columns)),
        sql.SQL(", ").join(
            sql.SQL("{} = EXCLUDED.{}").format(sql.Identifier(c), sql.Identifier(c))
            for c in update_cols
        )
    )

    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cur:
            for start in range(0, total, chunk_size):
                chunk = df.iloc[start:start+chunk_size]
                records = [row_to_tuple(r, columns) for _, r in chunk.iterrows()]
                
                if records:
                    execute_values(cur, upsert_template, records)
                    stats["total_processed"] += len(records)
                    print(f"Traité {stats['total_processed']} lignes sur {total}...")
            
            conn.commit()

    stats["inserted"] = stats["total_processed"]
    return stats


def insert_data_without_code(df: pd.DataFrame, table_name: str,
                             columns: list, chunk_size: int) -> int:
    """Insère les données sans code unique"""
    total = len(df)
    if total == 0:
        return 0
    
    processed = 0

    schema_table = table_name.split('.')
    if len(schema_table) == 2:
        table_identifier = sql.Identifier(schema_table[0], schema_table[1])
    else:
        table_identifier = sql.Identifier(table_name)

    insert_template = sql.SQL(
        "INSERT INTO {} ({}) VALUES %s"
    ).format(
        table_identifier,
        sql.SQL(", ").join(map(sql.Identifier, columns))
    )

    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cur:
            for start in range(0, total, chunk_size):
                chunk = df.iloc[start:start+chunk_size]
                records = [row_to_tuple(r, columns) for _, r in chunk.iterrows()]
                
                if records:
                    execute_values(cur, insert_template, records)
                    processed += len(records)
                    print(f"Traité {processed} lignes sans code sur {total}...")
            
            conn.commit()

    return processed


def import_france_to_bis(
    table_name: str = "public.medicaments_afmps",
    chunk_size: int = 5000,
) -> Dict[str, Any]:
    """
    Importe les médicaments français (BDPM) dans la base de données.
    
    Args:
        table_name: Nom de la table cible
        chunk_size: Taille des chunks pour l'import
    """
    print(f"\n{'='*60}")
    print(f"Import BDPM France")
    print(f"Table cible: {table_name}")
    print(f"{'='*60}\n")

    if not validate_table_name(table_name):
        raise ValueError(f"Nom de table invalide : {table_name}")

    # Charger les 3 fichiers
    df_cis, df_cip, df_compo = load_france_data()
    
    # Joindre les données
    df_merged = join_france_data(df_cis, df_cip, df_compo)
    
    # Préparer au format unifié
    df_clean = prepare_france_dataframe(df_merged)
    
    columns = [
        "name", "dose", "forme_pharmaceutique", "voie_administration", "conditionnement",
        "substance_active", "code_atc", "code_cnk", "code_fmd",
        "url_notice_fr", "url_notice_nl", "url_notice_de",
        "url_rcp", "url_summary_rmp_fr", "url_summary_rmp_nl", "url_summary_rmp_de",
        "date_derniere_publication_rcp_notice", "date_derniere_approbation_rcp_notice",
    ]
    
    # Déduplication
    print("\nDéduplication des données...")
    df_with_code, df_without_code, dedup_stats = deduplicate_by_code(df_clean)
    
    print(f"✓ Lignes totales: {dedup_stats['total_rows']}")
    print(f"✓ Lignes sans CIP13: {dedup_stats['rows_without_code']}")
    print(f"✓ Doublons (supprimés): {dedup_stats['duplicate_code']}")
    print(f"✓ CIP13 uniques à importer: {dedup_stats['unique_code']}")

    total_processed = 0

    # UPSERT des données avec code
    if len(df_with_code) > 0:
        print(f"\nImport des données avec CIP13 (UPSERT)...")
        upsert_stats = upsert_data_chunks(df_with_code, table_name, columns, chunk_size)
        total_processed += upsert_stats['total_processed']
    else:
        print("\n⚠ Aucune donnée avec CIP13.")

    # INSERT des données sans code
    if len(df_without_code) > 0:
        print(f"\nImport des données sans CIP13 (INSERT)...")
        inserted_without_code = insert_data_without_code(df_without_code, table_name, columns, chunk_size)
        total_processed += inserted_without_code
    else:
        inserted_without_code = 0

    # Résumé final
    print(f"\n{'='*60}")
    print(f"✓ Import France terminé avec succès!")
    print(f"  - Lignes totales traitées: {total_processed}")
    print(f"  - Avec CIP13 (UPSERT): {dedup_stats['unique_code']}")
    print(f"  - Sans CIP13 (INSERT): {inserted_without_code}")
    print(f"  - Doublons supprimés: {dedup_stats['duplicate_code']}")
    print(f"{'='*60}\n")

    return {
        "source": "France (BDPM)",
        "table": table_name,
        "rows_with_code": dedup_stats['unique_code'],
        "rows_without_code": inserted_without_code,
        "duplicates_removed": dedup_stats['duplicate_code'],
        "rows_processed": total_processed,
    }
