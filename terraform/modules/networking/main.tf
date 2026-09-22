resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    name      = "${var.name_prefix}-vpc"
    project   = "neostream"
    managedBy = "terraform"
  }
}

resource "aws_subnet" "public" {
  for_each = var.public_subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = {
    name      = "${var.name_prefix}-${each.key}"
    tier      = "web"
    managedBy = "terraform"
  }
}

resource "aws_subnet" "app" {
  for_each = var.private_subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = false

  tags = {
    name      = "${var.name_prefix}-${each.key}"
    tier      = "app"
    managedBy = "terraform"
  }
}

resource "aws_subnet" "db" {
  for_each = var.db_subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = false

  tags = {
    name      = "${var.name_prefix}-${each.key}"
    tier      = "db"
    managedBy = "terraform"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    name      = "${var.name_prefix}-igw"
    managedBy = "terraform"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    name      = "${var.name_prefix}-nat-eip"
    managedBy = "terraform"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id

  subnet_id  = aws_subnet.public[var.nat_gateway_subnet_key].id
  depends_on = [aws_internet_gateway.main]
  tags = {
    name      = "${var.name_prefix}-nat"
    managedBy = "terraform"
  }
}
resource "aws_route_table" "public" {
  # route tablle for public-subnet
  vpc_id = aws_vpc.main.id
  tags = {
    name      = "${var.name_prefix}-public-rt"
    tier      = "web"
    managedBy = "terraform"
  }
}
resource "aws_route_table" "app" {
  # route table for app subnet
  vpc_id = aws_vpc.main.id
  tags = {
    name      = "${var.name_prefix}-private-app-rt"
    managedBy = "terraform"
    tier      = "app"
  }
}

resource "aws_route_table" "db" {
  vpc_id = aws_vpc.main.id
  tags = {
    name      = "${var.name_prefix}-private-db-rt"
    managedBy = "terraform"
    tier      = "db"
  }
}

resource "aws_route" "public_internet" {
  # 0.0.0.0/0 -> destin to igw
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}


resource "aws_route" "private_internet" {
  # 0.0.0.0/0 -> destin to nat
  route_table_id         = aws_route_table.app.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}


# route table association with subnets
resource "aws_route_table_association" "public" {
  # associate routetable with subnets
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "app" {
  for_each = aws_subnet.app

  subnet_id      = each.value.id
  route_table_id = aws_route_table.app.id
}

resource "aws_route_table_association" "db" {
  for_each = aws_subnet.db

  subnet_id      = each.value.id
  route_table_id = aws_route_table.db.id
}

