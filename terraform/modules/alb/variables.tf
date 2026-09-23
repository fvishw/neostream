variable "prefix_name" {
  type        = string
  description = "Prefix name for the ALB resources"
}

variable "vpc_id" {
  type = string
}

variable "public_alb_sg_id" {
  type        = list(string)
  description = "Security group IDs for the public ALB"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Subnet IDs for the public ALB"
}

variable "internal_alb_sg_id" {
  type        = list(string)
  description = "Security group IDs for the internal ALB"
}

variable "internal_subnet_ids" {
  type        = list(string)
  description = "Subnet IDs for the internal ALB"
}

variable "web_port" {
  type        = number
  description = "Port for the web ALB"
}
variable "app_port" {
  type        = number
  description = "Port for the app ALB"
}