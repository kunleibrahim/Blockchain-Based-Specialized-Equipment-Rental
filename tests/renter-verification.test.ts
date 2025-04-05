import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity environment
const mockClarity = {
  contracts: {
    'renter-verification': {
      verifiedRenters: new Map(),
      verificationAuthorities: new Map(),
      contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      blockHeight: 100, // Mock block height
      
      setVerificationAuthority(sender, authority, isActive) {
        if (sender !== this.contractOwner) {
          return { error: 1 };
        }
        
        this.verificationAuthorities.set(authority, { isActive });
        return { result: { value: true } };
      },
      
      verifyRenter(sender, renter, expiry, qualificationLevel) {
        const authority = this.verificationAuthorities.get(sender);
        
        if (!authority || !authority.isActive) {
          return { error: 2 };
        }
        
        this.verifiedRenters.set(renter, {
          isVerified: true,
          verificationExpiry: expiry,
          qualificationLevel,
          verificationAuthority: sender
        });
        
        return { result: { value: true } };
      },
      
      isAuthority(authority) {
        const auth = this.verificationAuthorities.get(authority);
        return { result: { value: auth ? auth.isActive : false } };
      },
      
      isVerified(renter) {
        const verification = this.verifiedRenters.get(renter);
        
        if (!verification) {
          return { result: { value: false } };
        }
        
        const isValid = verification.isVerified &&
            this.blockHeight < verification.verificationExpiry;
        
        return { result: { value: isValid } };
      },
      
      getQualificationLevel(renter) {
        const verification = this.verifiedRenters.get(renter);
        return { result: { value: verification ? verification.qualificationLevel : 0 } };
      }
    }
  }
};

// Mock principals
const mockOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockAuthority = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const mockRenter = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
const mockUnauthorized = 'ST1WDX8M3VDWSW87C14E5G5KPMQ7R3VWXK95MQA2';

describe('Renter Verification Contract', () => {
  const contract = mockClarity.contracts['renter-verification'];
  
  beforeEach(() => {
    // Reset the contract state before each test
    contract.verifiedRenters = new Map();
    contract.verificationAuthorities = new Map();
    contract.contractOwner = mockOwner;
    contract.blockHeight = 100;
  });
  
  it('should set verification authority', () => {
    const result = contract.setVerificationAuthority(
        mockOwner,
        mockAuthority,
        true
    );
    
    expect(result.result.value).toBe(true);
    
    const authority = contract.verificationAuthorities.get(mockAuthority);
    expect(authority).toBeDefined();
    expect(authority.isActive).toBe(true);
  });
  
  it('should not allow non-owners to set verification authority', () => {
    const result = contract.setVerificationAuthority(
        mockUnauthorized,
        mockAuthority,
        true
    );
    
    expect(result.error).toBe(1);
    
    const authority = contract.verificationAuthorities.get(mockAuthority);
    expect(authority).toBeUndefined();
  });
  
  it('should verify a renter', () => {
    // Set up authority first
    contract.setVerificationAuthority(mockOwner, mockAuthority, true);
    
    const result = contract.verifyRenter(
        mockAuthority,
        mockRenter,
        200, // Expiry block height
        2    // Qualification level
    );
    
    expect(result.result.value).toBe(true);
    
    const verification = contract.verifiedRenters.get(mockRenter);
    expect(verification).toBeDefined();
    expect(verification.isVerified).toBe(true);
    expect(verification.qualificationLevel).toBe(2);
  });
  
  it('should not allow unauthorized authorities to verify renters', () => {
    const result = contract.verifyRenter(
        mockUnauthorized,
        mockRenter,
        200,
        2
    );
    
    expect(result.error).toBe(2);
    
    const verification = contract.verifiedRenters.get(mockRenter);
    expect(verification).toBeUndefined();
  });
  
  it('should check if a renter is verified', () => {
    // Set up authority and verify renter
    contract.setVerificationAuthority(mockOwner, mockAuthority, true);
    contract.verifyRenter(mockAuthority, mockRenter, 200, 2);
    
    const result = contract.isVerified(mockRenter);
    
    expect(result.result.value).toBe(true);
  });
  
  it('should return false for expired verifications', () => {
    // Set up authority and verify renter with expired verification
    contract.setVerificationAuthority(mockOwner, mockAuthority, true);
    contract.verifyRenter(mockAuthority, mockRenter, 50, 2); // Expired (block height 100 > 50)
    
    const result = contract.isVerified(mockRenter);
    
    expect(result.result.value).toBe(false);
  });
  
  it('should get qualification level', () => {
    // Set up authority and verify renter
    contract.setVerificationAuthority(mockOwner, mockAuthority, true);
    contract.verifyRenter(mockAuthority, mockRenter, 200, 3);
    
    const result = contract.getQualificationLevel(mockRenter);
    
    expect(result.result.value).toBe(3);
  });
  
  it('should return 0 for unverified renters', () => {
    const result = contract.getQualificationLevel(mockUnauthorized);
    
    expect(result.result.value).toBe(0);
  });
});
