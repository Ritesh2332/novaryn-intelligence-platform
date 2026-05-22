pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = '1'

        NEWS_API_KEY  = credentials('NEWS_API_KEY')
        GROQ_API_KEY  = credentials('GROQ_API_KEY')
        GNEWS_API_KEY = credentials('GNEWS_API_KEY')
        HF_TOKEN      = credentials('HF_TOKEN')
    }

    stages {

        stage('Verify Docker') {
            steps {
                sh 'docker --version'
                sh 'docker-compose version'
            }
        }

        stage('Create Env File') {
            steps {
                writeFile file: '.env', text: """
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/novaryn_db

NEWS_API_KEY=${NEWS_API_KEY}
GROQ_API_KEY=${GROQ_API_KEY}
GNEWS_API_KEY=${GNEWS_API_KEY}
HF_TOKEN=${HF_TOKEN}
"""
            }
        }

        stage('Build & Start Services') {
            steps {
                sh 'docker-compose down --volumes --remove-orphans || true'
                sh 'docker-compose up -d --build'
                sh 'docker-compose ps'
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 20'
                sh 'curl -f http://localhost:8000/docs'
                sh 'curl -f http://localhost:5000'
            }
        }
    }

    post {
        failure {
            sh 'docker-compose logs backend --tail=50 || true'
            sh 'docker-compose logs frontend --tail=20 || true'
        }

        cleanup {
            sh 'docker-compose down --volumes --remove-orphans || true'
        }
    }
}