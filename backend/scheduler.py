#!/usr/bin/env python3
"""
Scheduler autonome pour MediTime.

Ce processus gère uniquement les tâches planifiées (cron jobs).
Il ne dépend PAS de Flask et peut tourner indépendamment de l'API.

Utilisation:
    python scheduler.py

Tâches configurées:
    - Diminution quotidienne des stocks à minuit (00:00)
    - Vérification et envoi de notifications pour tous les utilisateurs toutes les 30 minutes
"""

import signal
import sys
import time
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

# Import des initialisations partagées
from app.core.firebase_init import init_firebase
from app.core.vertex_init import init_vertex_ai
from app.core.db_init import verify_db_connection
from app.utils.logging import log_backend

# Import des tâches cron
from app.cron.tasks import decrease_stock, send_notifications_for_all_users


def shutdown_handler(signum, frame):
    """Gestion propre de l'arrêt du scheduler."""
    log_backend.info("Signal d'arrêt reçu, fermeture du scheduler...", {
        "origin": "SCHEDULER",
        "code": "SCHEDULER_SHUTDOWN",
        "signal": signum
    })
    sys.exit(0)


def main():
    """Point d'entrée du scheduler."""
    
    # Configuration des signaux pour arrêt propre
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)
    
    log_backend.info("🚀 Démarrage du scheduler MediTime", {
        "origin": "SCHEDULER",
        "code": "SCHEDULER_START"
    })
    
    # Initialisation des services partagés (DB, Firebase, Vertex)
    try:
        if not verify_db_connection():
            log_backend.error("Impossible de se connecter à la DB, arrêt du scheduler", {
                "origin": "SCHEDULER",
                "code": "SCHEDULER_DB_ERROR"
            })
            sys.exit(1)
        
        init_firebase()
        init_vertex_ai()
        
        log_backend.info("✅ Services initialisés avec succès", {
            "origin": "SCHEDULER",
            "code": "SCHEDULER_INIT_SUCCESS"
        })
        
    except Exception as e:
        log_backend.error("Erreur lors de l'initialisation des services", {
            "origin": "SCHEDULER",
            "code": "SCHEDULER_INIT_ERROR",
            "error": str(e)
        })
        sys.exit(1)
    
    # Configuration du scheduler APScheduler (Blocking)
    scheduler = BlockingScheduler()
    
    # Tâche : Diminution quotidienne des stocks à minuit
    scheduler.add_job(
        decrease_stock,
        CronTrigger(hour=0, minute=0),
        id='daily_stock_decrease',
        name='Diminution quotidienne des stocks',
        max_instances=1,  # Empêche les exécutions multiples
        replace_existing=True
    )
    
    # vérification et envoi de notifications pour tous les utilisateurs toute les 30 minutes
    scheduler.add_job(
        send_notifications_for_all_users,
        CronTrigger(minute='*/30'),
        id='stock_notification',
        name='Notifications de stock faible',
        max_instances=1,
        replace_existing=True
    )
    send_notifications_for_all_users()
    
    log_backend.info("⏰ Tâches planifiées configurées", {
        "origin": "SCHEDULER",
        "code": "SCHEDULER_JOBS_CONFIGURED",
        "jobs": [job.id for job in scheduler.get_jobs()]
    })
    
    # Démarrage du scheduler (bloquant)
    try:
        log_backend.info("▶️ Scheduler en cours d'exécution...", {
            "origin": "SCHEDULER",
            "code": "SCHEDULER_RUNNING"
        })
        scheduler.start()
        
    except (KeyboardInterrupt, SystemExit):
        log_backend.info("Arrêt du scheduler", {
            "origin": "SCHEDULER",
            "code": "SCHEDULER_STOPPED"
        })
    
    except Exception as e:
        log_backend.error("Erreur dans le scheduler", {
            "origin": "SCHEDULER",
            "code": "SCHEDULER_ERROR",
            "error": str(e)
        })
        sys.exit(1)


if __name__ == "__main__":
    main()
