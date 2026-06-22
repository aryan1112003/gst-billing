-- Create gate_passes table without foreign keys initially
DROP TABLE IF EXISTS gate_passes;

CREATE TABLE gate_passes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gate_pass_number VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('inward', 'outward') NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    driver_phone VARCHAR(20) NOT NULL,
    purpose TEXT,
    items_description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    remarks TEXT,
    status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    agency_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gate_pass_number (gate_pass_number),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_agency_id (agency_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Try to add foreign keys one by one
ALTER TABLE gate_passes ADD CONSTRAINT fk_gate_pass_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
ALTER TABLE gate_passes ADD CONSTRAINT fk_gate_pass_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
