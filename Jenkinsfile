pipeline{
    agent any
    enviornment{
        VITE_API_URL = credentials('VITE_API_URL')
        FRONTEND_S3_BUCKET_NAME = credentials('FRONTEND_S3_BUCKET_NAME') #"neostream-fvishw"
        BACKEND_IMG_NAME = "fvishw/neostream"
        BACKEND_MIGRATE_IMG_NAME = "fvishw/neostream-migrate"
        BACKEND_IMG_TAG = "${BACKEND_IMG_NAME}:${GIT_COMMIT}"
        BACKEND_MIGRATE_IMG_TAG = "${BACKEND_MIGRATE_IMG_NAME}:${GIT_COMMIT}"
    }
    stages{
        stage('Build Docker Images and Frontend'){
            parallel{
                stage('Build Backend'){
                    steps{
                        sh 'docker build -t ${BACKEND_IMG_TAG} -f backend/Dockerfile-backend backend'
                    }
                }
                stage('Build Backend Migrate'){
                    steps{
                        sh 'docker build -t ${BACKEND_MIGRATE_IMG_TAG} -f backend/Dockerfile-migrate backend'
                    }
                }
                stage('Build Frontend'){
                    steps{
                        sh "cd frontend && npm ci && npm run build"
                    }
            }
        }
        stage('Push Docker Images'){
            steps{
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                    sh 'docker push ${BACKEND_IMG_TAG}'
                    sh 'docker push ${BACKEND_MIGRATE_IMG_TAG}'
                }
            }
        }
        // stage('Run Backend Migrations'){
        //     steps{
        //         withCredentials([usernamePassword(credentialsId: 'aws', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
        //             sh 'aws s3 sync frontend/dist s3://${FRONTEND_S3_BUCKET_NAME} --delete'
        //         }
        //     }
        // }
        // stage('Deploy Backend to ECS'){
        //     steps{
        //         withCredentials([usernamePassword(credentialsId: 'aws', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
        //             sh 'aws ecs update-service --cluster neostream-cluster --service neostream-service --force-new-deployment'
        //         }
        //     }
        // }
        // stage('Upload Frontend to S3'){
        //     steps{
        //         withCredentials([usernamePassword(credentialsId: 'aws', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
        //             sh 'aws s3 sync frontend/dist s3://${FRONTEND_S3_BUCKET_NAME} --delete'
        //         }
        //     }
        // }

}