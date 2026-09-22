output "vpc_id" {
  value = module.networking.vpc_id
}
output "public_subnet_ids" {
  value = module.networking.web_subnet_ids
}
output "app_subnet_ids" {
  value = module.networking.app_subnet_ids
}
output "db_subnet_ids" {
  value = module.networking.db_subnet_ids
}
output "nat_public_ip" {
  value = module.networking.nat_gateway_public_ip
}