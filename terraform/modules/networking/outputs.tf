output "vpc_id" {
  description = "neostream vpc id"
  value       = aws_vpc.main.id
}

output "web_subnet_ids" {
  description = "neostream public web subnet ids"
  value       = values(aws_subnet.public)[*].id
}
output "app_subnet_ids" {
  description = "neostream private app subnet ids"
  value       = values(aws_subnet.app)[*].id
}
output "db_subnet_ids" {
  description = "neostream db subnet ids"
  value       = values(aws_subnet.db)[*].id
}

output "igw_id" {
  description = "neostream vpc igw id"
  value       = aws_internet_gateway.main.id
}

output "public_route_table_id" {
  description = "public route table id"
  value       = aws_route_table.public.id
}
output "app_route_table_id" {
  description = "app route table id"
  value       = aws_route_table.app.id
}
output "db_route_table_id" {
  description = "db route table id"
  value       = aws_route_table.db.id
}


output "nat_gateway_id" {
  description = "nat gateway id"
  value       = aws_nat_gateway.main.id
}
output "nat_gateway_public_ip" {
  description = "nat gateway public id"
  value       = aws_eip.nat.public_ip
}