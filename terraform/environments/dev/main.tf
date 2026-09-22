module "networking" {
  source = "../../modules/networking"

  name_prefix = "neostream"

  vpc_cidr = "10.0.0.0/16"

  public_subnets = {
    public-web-a = {
      cidr = "10.0.1.0/24"
      az   = "ap-south-1a"
    }
    public-web-b = {
      cidr = "10.0.4.0/24"
      az   = "ap-south-1b"
    }
  }

  private_subnets = {
    private-app-a = {
      cidr = "10.0.2.0/24"
      az   = "ap-south-1a"
    }
    private-app-b = {
      cidr = "10.0.5.0/24"
      az   = "ap-south-1b"
    }
  }

  db_subnets = {
    private-db-a = {
      cidr = "10.0.3.0/24"
      az   = "ap-south-1a"
    }
    private-db-b = {
      cidr = "10.0.6.0/24"
      az   = "ap-south-1b"
    }
  }

  nat_gateway_subnet_key = "public-web-a"
}

module "security" {
  source = "../../modules/security"

  app_port          = 3000
  db_port           = 5432
  internal_alb_port = 3000
  name_prefix       = "neostream"
  vpc_id            = module.networking.vpc_id

}
