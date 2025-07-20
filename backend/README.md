## 🛠 Setup and Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 2. Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create a .env file
echo "MONGODB_URL=your_mongodb_connection_string" > .env

# 5. Run the FastAPI app
fastapi dev main.py

