pipeline {
    agent any

    environment {
        PATH          = "$HOME/.local/bin:$PATH"
        DATABASE_URL  = "sqlite:///./test.db"
        NEWS_API_KEY  = credentials('NEWS_API_KEY')
        GROQ_API_KEY  = credentials('GROQ_API_KEY')
        GNEWS_API_KEY = credentials('GNEWS_API_KEY')
        HF_TOKEN      = credentials('HF_TOKEN')
    }

    stages {

        stage('Verify Environment') {
            steps {
                sh 'python3 --version'
                sh 'python3 -m venv --without-pip venv'
                sh 'curl -sSL https://bootstrap.pypa.io/get-pip.py -o get-pip.py'
                sh './venv/bin/python get-pip.py'
                sh './venv/bin/python --version'
                sh './venv/bin/pip --version'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                sh '''
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r backend/requirements.txt
'''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                sh './venv/bin/pip install -r frontend/requirements.txt'
            }
        }

        stage('Download ML Models & Data') {
            steps {
                sh './venv/bin/python -m spacy download en_core_web_sm'
                sh './venv/bin/python -c "import nltk; nltk.download(\'punkt\'); nltk.download(\'stopwords\')"'
            }
        }

        stage('Verify Backend Imports') {
            steps {
                sh './venv/bin/python -c "from backend.app.main import app; print(\'Backend imports OK\')"'
            }
        }

        stage('Verify Frontend Imports') {
            steps {
                sh './venv/bin/python -c "import sys; sys.path.insert(0, \'frontend\'); from app import app; print(\'Frontend imports OK\')"'
            }
        }

        stage('Run Tests') {
            steps {
                sh './venv/bin/pytest backend/tests -v --tb=short'
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
# Start backend in background
./venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for startup
sleep 15

# Health check
curl -f http://127.0.0.1:8000/ || exit 1
curl -f http://127.0.0.1:8000/docs || exit 1

# Stop backend
kill $BACKEND_PID || true
'''
            }
        }
    }

    post {
        always {
            sh 'rm -f test.db'
            sh 'pkill -f uvicorn || true'
        }
    }
}