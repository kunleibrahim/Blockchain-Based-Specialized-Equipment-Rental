
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity environment
const mockClarity = {
  contracts: {
    'equipment-registration': {
      lastEquipmentId: 0,
      equipments: new Map(),
      
      registerEquipment(sender, name, description, dailyRate, depositAmount) {
        this.lastEquipmentId += 1;
        const id = this.lastEquipmentId;
        
        this.equipments.set(id, {
          name,
          description,
          owner: sender,
          dailyRate,
          depositAmount,
          isAvailable: true
        });
        
        return { result: { value: id } };
      },
      
      getEquipment(id) {
        const equipment = this.equipments.get(id);
        return equipment ? { result: { value: equipment } } : { result: { value: null } };
      },
      
      updateAvailability(sender, id, isAvailable) {
        const equipment = this.equipments.get(id);
        
        if (!equipment) {
          return { error: 1 };
        }
        
        if (equipment.owner !== sender) {
          return { error: 2 };
        }
        
        equipment.isAvailable = isAvailable;
        this.equipments.set(id, equipment);
        
        return { result: { value: true } };
      }
    }
  }
};

// Mock the tx-sender
const mockSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockOtherSender = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

describe('Equipment Registration Contract', () => {
  const contract = mockClarity.contracts['equipment-registration'];
  
  beforeEach(() => {
    // Reset the contract state before each test
    contract.lastEquipmentId = 0;
    contract.equipments = new Map();
  });
  
  it('should register new equipment', () => {
    const result = contract.registerEquipment(
        mockSender,
        'Excavator XL-2000',
        'Heavy duty excavator for construction',
        500,
        5000
    );
    
    expect(result.result.value).toBe(1);
    expect(contract.lastEquipmentId).toBe(1);
    
    const equipment = contract.equipments.get(1);
    expect(equipment).toBeDefined();
    expect(equipment.name).toBe('Excavator XL-2000');
    expect(equipment.owner).toBe(mockSender);
    expect(equipment.isAvailable).toBe(true);
  });
  
  it('should get equipment details', () => {
    // Register equipment first
    contract.registerEquipment(
        mockSender,
        'Excavator XL-2000',
        'Heavy duty excavator for construction',
        500,
        5000
    );
    
    const result = contract.getEquipment(1);
    
    expect(result.result.value).toBeDefined();
    expect(result.result.value.name).toBe('Excavator XL-2000');
    expect(result.result.value.dailyRate).toBe(500);
  });
  
  it('should return null for non-existent equipment', () => {
    const result = contract.getEquipment(999);
    
    expect(result.result.value).toBeNull();
  });
  
  it('should update equipment availability', () => {
    // Register equipment first
    contract.registerEquipment(
        mockSender,
        'Excavator XL-2000',
        'Heavy duty excavator for construction',
        500,
        5000
    );
    
    const result = contract.updateAvailability(mockSender, 1, false);
    
    expect(result.result.value).toBe(true);
    
    const equipment = contract.equipments.get(1);
    expect(equipment.isAvailable).toBe(false);
  });
  
  it('should not allow non-owners to update availability', () => {
    // Register equipment first
    contract.registerEquipment(
        mockSender,
        'Excavator XL-2000',
        'Heavy duty excavator for construction',
        500,
        5000
    );
    
    const result = contract.updateAvailability(mockOtherSender, 1, false);
    
    expect(result.error).toBe(2);
    
    const equipment = contract.equipments.get(1);
    expect(equipment.isAvailable).toBe(true); // Unchanged
  });
});
