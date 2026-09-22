variable "name_prefix" {
  description = "Prefix used when naming network resource"
  type        = string
}
variable "vpc_cidr" {
  description = "CIDR block for the vpc"
  type        = string
}
variable "public_subnets" {
  description = "Public web-tier subnets"
  type = map(object({
    cidr = string
    az   = string
  }))
}
variable "private_subnets"{
    description = "Private subnet for app tier subnets"
    type = map(object({
        cidr= string
        az= string
    }))
}
variable "db_subnets" {
    description = "Private database-tier subents"
    type = map(object({
        cidr = string
        az = string
    }))
}
variable "nat_gateway_subnet_key" {
  description = "value of subnet key in nat-gateway will be created"
  type = string
}
