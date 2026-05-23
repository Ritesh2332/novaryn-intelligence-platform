pipeline {
    agent any

    environment {
        NEWS_API_KEY  = credentials('NEWS_API_KEY')
        GROQ_API_KEY  = credentials('GROQ_API_KEY')
        GNEWS_API_KEY = credentials('GNEWS_API_KEY')
        HF_TOKEN      = credentials('HF_TOKEN')
    }

    stages {

        stage('Verify Environment') {
            steps {
                sh 'python3 --version || python --version'
                sh 'pip3 --version || pip --version'
            }
        }

        stage('Create Env File') {
            steps {
                writeFile file: '.env', text: """
DATABASE_URL=sqlite:///./test.db
NEWS_API_KEY=${NEWS_API_KEY}
GROQ_API_KEY=${GROQ_API_KEY}
GNEWS_API_KEY=${GNEWS_API_KEY}
HF_TOKEN=${HF_TOKEN}
"""
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                sh '''
python3 -m venv venv || python -m venv venv
. venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
'''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                sh '''
. venv/bin/activate
pip install -r frontend/requirements.txt
'''
            }
        }

        stage('Verify Backend Imports') {
            steps {
                sh '''
. venv/bin/activate
python -c "from backend.app.main import app; print('Backend imports OK')"
'''
            }
        }

        stage('Verify Frontend Imports') {
            steps {
                sh '''
. venv/bin/activate
python -c "import sys; sys.path.insert(0, 'frontend'); from app import app; print('Frontend imports OK')"
'''
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
. venv/bin/activate
# Start backend in background
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
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