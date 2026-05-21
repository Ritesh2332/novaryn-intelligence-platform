pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = '1'
    }

    stages {

        stage('Verify Docker') {
            steps {
                bat 'docker --version'
                bat 'docker compose version'
            }
        }

        stage('Build & Start Services') {
            steps {
                bat 'docker compose down --volumes --remove-orphans'
                bat 'docker compose up -d --build'
                bat 'docker compose ps'
            }
        }

        stage('Health Check') {
            steps {
                bat 'python -c "import time; time.sleep(10)"'
                bat 'curl -f http://localhost:8000/docs'
                bat 'curl -f http://localhost:5000'
            }
        }
    }

    post {
        failure {
            bat 'docker compose logs backend --tail=50'
            bat 'docker compose logs frontend --tail=20'
        }

        cleanup {
            bat 'docker compose down --volumes --remove-orphans'
        }
    }
}