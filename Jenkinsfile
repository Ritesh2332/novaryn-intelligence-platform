pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = '1'
    }

    stages {

        stage('Verify Docker') {
            steps {
                sh 'docker --version'
                sh 'docker compose version'
            }
        }

        stage('Build & Start Services') {
            steps {
                sh 'docker compose down --volumes --remove-orphans || true'
                sh 'docker compose up -d --build'
                sh 'docker compose ps'
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 10'
                sh 'curl -f http://localhost:8000/docs'
                sh 'curl -f http://localhost:5000'
            }
        }
    }

    post {
        failure {
            sh 'docker compose logs backend --tail=50'
            sh 'docker compose logs frontend --tail=20'
        }

        cleanup {
            sh 'docker compose down --volumes --remove-orphans || true'
        }
    }
}