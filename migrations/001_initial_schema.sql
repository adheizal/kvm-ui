-- Migration: Initial Schema
-- Description: Create instances and users tables with sequences

-- Create the sequence for instances table
CREATE SEQUENCE IF NOT EXISTS instances_id_seq;

-- Create instances table
CREATE TABLE IF NOT EXISTS public.instances (
   id integer NOT NULL DEFAULT nextval('instances_id_seq'::regclass),
   vm_name text NOT NULL,
   ip_address text NOT NULL,
   ssh_port integer NULL,
   service_ports text NULL,
   os_name text NULL,
   disk_size integer NULL DEFAULT 30,
   created_at timestamp DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (id)
);

-- Create the sequence for users table
CREATE SEQUENCE IF NOT EXISTS users_id_seq;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
   id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
   username character varying(50) NOT NULL,
   password character varying(100) NOT NULL,
   created_at timestamp DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (id),
   UNIQUE (username)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instances_vm_name ON instances(vm_name);
CREATE INDEX IF NOT EXISTS idx_instances_ip_address ON instances(ip_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
