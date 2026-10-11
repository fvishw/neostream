def waitForTaskCompletion(String taskArn) {
    withEnv(["TASK_ARN=${taskArn}"]) {
        sh """
            aws ecs wait tasks-stopped \
                --cluster "$ECS_CLUSTER" \
                --tasks "$TASK_ARN"
        """

        def exitCode = sh(
            script: """
                aws ecs describe-tasks \
                    --cluster "$ECS_CLUSTER" \
                    --tasks "$TASK_ARN" \
                    --query 'tasks[0].containers[0].exitCode' \
                    --output text
            """,
            returnStdout: true
        ).trim()

        if (exitCode != '0') {
            def reason = sh(
                script: '''
                    aws ecs describe-tasks \
                        --cluster "$ECS_CLUSTER" \
                        --tasks "$TASK_ARN" \
                        --query 'tasks[0].stoppedReason' \
                        --output text
                ''',
                returnStdout: true
            ).trim()

            error("Task failed with exit code ${exitCode}. Reason: ${reason}")
        }

        echo 'Task completed successfully.'
    }
}

def updateTaskImage(String taskFamily,String newImage,String fileName){
    withEnv(["NEW_IMG=${newImage}","TASK_FAMILY=${taskFamily}","FILE_NAME=${fileName}"]){
        sh  '''
                aws ecs describe-task-definition \
                    --task-definition "$TASK_FAMILY" |
                    jq --arg IMAGE "$NEW_IMG" \
                    '.taskDefinition
                    | .containerDefinitions[0].image = $IMAGE
                    | del(.taskDefinitionArn, .revision, .status,
                        .requiresAttributes, .compatibilities,
                        .registeredAt, .registeredBy)' > "$FILE_NAME".json

                echo "Updated task definition JSON saved to $FILE_NAME.json"
            '''
       def  taskDefinitionArn = sh(
            script: '''
                aws ecs register-task-definition \
                    --cli-input-json file://"$FILE_NAME".json \
                    --query 'taskDefinition.taskDefinitionArn' \
                    --output text
            ''',
            returnStdout: true
        ).trim()

        return taskDefinitionArn
    }
}

pipeline{
    agent any
    tools{
        nodejs "node"
    }
    environment{
        VITE_API_URL = credentials('VITE_API_URL')
        FRONTEND_S3_BUCKET_NAME = credentials('FRONTEND_S3_BUCKET_NAME')
        BACKEND_IMG_NAME = "fvishw/neostream"
        BACKEND_MIGRATE_IMG_NAME = "fvishw/neostream-migrate"
        ECS_CLUSTER="neostream-cluster"
        ECS_BACKEND_DEFINATION="neostream-be"
        ECS_MIGRATE_DEFINATION="neostream-migrate"
        ECS_BACKEND_SERVICE="neostream-be-service-f5391hrx"
        AWS_PRIVATE_SUBNET_IDS='"subnet-05f05b068af39eec9","subnet-00cf1ab6e01295095"'
        AWS_PRIVATE_SG='"sg-0844fe6bc7b46356f"'
        BACKEND_IMG_TAG = "${BACKEND_IMG_NAME}:${env.GIT_COMMIT}"
        BACKEND_MIGRATE_IMG_TAG = "${BACKEND_MIGRATE_IMG_NAME}:${env.GIT_COMMIT}"
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

        stage('Run Migration Task'){
            steps{
                  script{
                     def taskDefinitionArn = updateTaskImage(env.ECS_MIGRATE_DEFINATION,env.BACKEND_MIGRATE_IMG_TAG,"migration-task")
                    
                    def taskArn = sh(
                        script: """
                            aws ecs run-task \
                            --cluster "$ECS_CLUSTER" \
                            --task-definition "$taskDefinitionArn" \
                            --cli-input-json file://migration-task.json \
                            --launch-type FARGATE \
                            --network-configuration "awsvpcConfiguration={subnets=[$AWS_PRIVATE_SUBNET_IDS],securityGroups=[$AWS_PRIVATE_SG],assignPublicIp=DISABLED}" \
                            --query "tasks[0].taskArn" \
                            --output text
                        """.stripIndent(), 
                        returnStdout: true
                    ).trim()


                    echo "Task started! ARN: ${taskArn}"
                    echo "Waiting for migration task to finish execution..."
                
                waitForTaskCompletion(taskArn)
                  }
            }
        }

        stage('Update Backend Task Defination & Service'){
            steps{

                script{
                    
                        def taskDefinitionArn = updateTaskImage(env.ECS_BACKEND_DEFINATION,env.BACKEND_IMG_TAG,"backend-task")
                
                    sh """
                        aws ecs update-service \
                            --cluster "$ECS_CLUSTER" \
                            --service "$ECS_BACKEND_SERVICE" \
                            --task-definition "$taskDefinitionArn" \
                            --cli-input-json file://backend-task.json                        
                    """
                    
                    echo "Backend service updated successfully!"

                    sh """
                        aws ecs wait services-stable \
                            --cluster "$ECS_CLUSTER" \
                            --services "$ECS_BACKEND_SERVICE"
                    """

                    }

            }
        }
        
    }
}