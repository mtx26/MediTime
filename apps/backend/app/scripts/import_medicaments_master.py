"""
Script principal pour importer les médicaments depuis plusieurs sources
dans la base de données MediTime.

Sources supportées:
- Belgique (AFMPS)
- France (BDPM)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from typing import Dict, Any, List
from app.scripts.import_medicaments_afmps import import_afmps_to_bis
from app.scripts.import_medicaments_france import import_france_to_bis


def import_all_sources(
    table_name: str = "public.medicaments_afmps",
    sources: List[str] = ["belgique", "france"],
    chunk_size: int = 5000
) -> Dict[str, Any]:
    """
    Importe les médicaments depuis toutes les sources spécifiées.
    
    Args:
        table_name: Nom de la table cible
        sources: Liste des sources à importer ("belgique", "france")
        chunk_size: Taille des chunks pour l'import
    
    Returns:
        Dictionnaire avec les résultats de chaque import
    """
    
    print("\n" + "="*70)
    print("IMPORT MULTI-SOURCES DES MÉDICAMENTS")
    print("="*70)
    print(f"Sources: {', '.join(sources)}")
    print(f"Table cible: {table_name}")
    print("="*70 + "\n")
    
    from psycopg2 import sql
    from app.db.connection import get_connection
    
    schema_table = table_name.split('.')
    if len(schema_table) == 2:
        table_identifier = sql.Identifier(schema_table[0], schema_table[1])
        index_name = f"idx_{schema_table[1]}_code_fmd_unique"
    else:
        table_identifier = sql.Identifier(table_name)
        index_name = f"idx_{table_name}_code_fmd_unique"
    
    # ÉTAPE 1: S'assurer qu'il n'y a pas de doublons sur code_fmd non-NULL
    print("🔧 Nettoyage des doublons code_fmd...")
    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cur:
            # Supprimer les doublons en gardant une occurrence (ctid = plus petit)
            cur.execute(sql.SQL("""
                DELETE FROM {table}
                WHERE ctid IN (
                    SELECT ctid FROM (
                        SELECT ctid, ROW_NUMBER() OVER (PARTITION BY code_fmd ORDER BY ctid) as rn
                        FROM {table}
                        WHERE code_fmd IS NOT NULL
                    ) t
                    WHERE rn > 1
                )
            """).format(table=table_identifier))
            dups_removed = cur.rowcount
            conn.commit()
    print(f"✓ {dups_removed} doublons supprimés\n")
    
    # ÉTAPE 2: Supprimer tous les enregistrements sans code FMD
    print("🗑️  Suppression des anciens médicaments sans code FMD...")
    delete_query = sql.SQL("DELETE FROM {} WHERE code_fmd IS NULL").format(table_identifier)
    
    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cur:
            cur.execute(delete_query)
            deleted_count = cur.rowcount
            conn.commit()
    
    print(f"✓ {deleted_count} médicaments sans code FMD supprimés\n")
    print("-" * 70 + "\n")
    
    results = {}
    total_imported = 0
    
    # Import Belgique
    if "belgique" in sources:
        try:
            print("\n🇧🇪 IMPORT BELGIQUE (AFMPS)")
            print("-" * 70)
            result_be = import_afmps_to_bis(
                csv_path=None,
                table_name=table_name,
                chunk_size=chunk_size,
                auto_download=True
            )
            results["belgique"] = result_be
            total_imported += result_be.get("rows_processed", 0)
            print(f"\n✓ Belgique: {result_be.get('rows_processed', 0)} médicaments importés")
        except Exception as e:
            print(f"\n❌ Erreur import Belgique: {e}")
            results["belgique"] = {"error": str(e)}
    
    # Import France
    if "france" in sources:
        try:
            print("\n🇫🇷 IMPORT FRANCE (BDPM)")
            print("-" * 70)
            result_fr = import_france_to_bis(
                table_name=table_name,
                chunk_size=chunk_size
            )
            results["france"] = result_fr
            total_imported += result_fr.get("rows_processed", 0)
            print(f"\n✓ France: {result_fr.get('rows_processed', 0)} médicaments importés")
        except Exception as e:
            print(f"\n❌ Erreur import France: {e}")
            results["france"] = {"error": str(e)}
    
    # Résumé global
    print("\n" + "="*70)
    print("RÉSUMÉ GLOBAL DE L'IMPORT")
    print("="*70)
    
    for source, result in results.items():
        if "error" in result:
            print(f"❌ {source.upper()}: Échec - {result['error']}")
        else:
            print(f"✓ {source.upper()}: {result.get('rows_processed', 0)} médicaments")
    
    print(f"\n📊 TOTAL IMPORTÉ: {total_imported} médicaments")
    print("="*70 + "\n")
    
    return {
        "total_imported": total_imported,
        "sources": results,
        "table": table_name
    }


def import_belgique_only(table_name: str = "public.medicaments_afmps") -> Dict[str, Any]:
    """Import uniquement depuis la Belgique"""
    return import_all_sources(table_name=table_name, sources=["belgique"])


def import_france_only(table_name: str = "public.medicaments_afmps") -> Dict[str, Any]:
    """Import uniquement depuis la France"""
    return import_all_sources(table_name=table_name, sources=["france"])


if __name__ == "__main__":
    # Import depuis toutes les sources
    result = import_all_sources()
    print("\nRésultat final:", result)
