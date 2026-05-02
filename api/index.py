from app import create_app

app = create_app()

# This is required for Vercel to recognize the app
if __name__ == "__main__":
    app.run()
