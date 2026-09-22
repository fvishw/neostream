variable "name_prefix" {
  type        = string
  description = "project name for prefix resource name"
}

variable "vpc_id" {
  type        = string
  description = "vpc id where sg create"
}

variable "web_port" {
  type        = number
  default     = 80
  description = "Listener port for the web"
}

variable "app_port" {
  type        = number
  default     = 3000
  description = "Listener port for the app"
}

variable "db_port" {
  type        = number
  default     = 5432
  description = "Listener port for the database"
}

variable "internal_alb_port" {
  type        = number
  default     = 3000
  description = "Listener port for the internal ALB"
}