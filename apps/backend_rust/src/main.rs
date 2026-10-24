#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv()?;

    let database_url = std::env::var("DATABASE_URL")?;

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("Connexion à PostgreSQL réussie.");

    pool.close().await;
    Ok(())
}