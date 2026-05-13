import { describe, it, expect } from 'vitest';
import { hasPermission } from '@/lib/auth';

describe('hasPermission', () => {
  describe('ADMIN role', () => {
    it('has all permissions', () => {
      const perms = [
        'manageUsers', 'manageSettings', 'viewAnalytics', 'manageProducts',
        'manageOrders', 'manageServices', 'manageContent', 'manageAllAppointments',
      'manageAppointments', 'manageClients', 'viewClients',
      'manageBlog', 'createBlog', 'manageGallery', 'createGallery',
      'manageStaff',
      'bookAppointments', 'placeOrders', 'viewOwnData',
      'anythingElse', 'nonExistentPermission',
      ];
      for (const perm of perms) {
        expect(hasPermission('ADMIN', perm)).toBe(true);
      }
    });
  });

  describe('OWNER role', () => {
    const ownerPerms = [
      'manageAppointments', 'manageAllAppointments', 'manageOrders', 'manageProducts',
      'manageServices', 'viewAnalytics', 'manageContent', 'manageClients', 'viewClients',
      'manageBlog', 'manageGallery', 'createBlog', 'createGallery', 'manageUsers',
    ];

    for (const perm of ownerPerms) {
      it(`has permission: ${perm}`, () => {
        expect(hasPermission('OWNER', perm)).toBe(true);
      });
    }

    it('has manageStaff permission', () => {
      expect(hasPermission('OWNER', 'manageStaff')).toBe(true);
    });

    it('does not have CLIENT-only permissions', () => {
      expect(hasPermission('OWNER', 'bookAppointments')).toBe(false);
      expect(hasPermission('OWNER', 'placeOrders')).toBe(false);
      expect(hasPermission('OWNER', 'viewOwnData')).toBe(false);
    });

    it('does not have admin-only permissions', () => {
      expect(hasPermission('OWNER', 'manageSettings')).toBe(false);
    });
  });

  describe('RECEPTIONIST role', () => {
    const receptionistPerms = [
      'manageAppointments', 'manageClients', 'viewClients', 'manageOrders',
      'manageBlog', 'manageGallery', 'createBlog', 'createGallery',
    ];

    for (const perm of receptionistPerms) {
      it(`has permission: ${perm}`, () => {
        expect(hasPermission('RECEPTIONIST', perm)).toBe(true);
      });
    }

    it('does not have owner-level permissions', () => {
      expect(hasPermission('RECEPTIONIST', 'manageProducts')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'manageServices')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'viewAnalytics')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'manageUsers')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'manageAllAppointments')).toBe(false);
    });

    it('does not have client-only permissions', () => {
      expect(hasPermission('RECEPTIONIST', 'bookAppointments')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'viewOwnData')).toBe(false);
    });
  });

  describe('CLIENT role', () => {
    const clientPerms = ['bookAppointments', 'placeOrders', 'viewOwnData'];

    for (const perm of clientPerms) {
      it(`has permission: ${perm}`, () => {
        expect(hasPermission('CLIENT', perm)).toBe(true);
      });
    }

    it('does not have staff permissions', () => {
      const staffPerms = [
        'manageAppointments', 'manageClients', 'manageOrders',
        'manageBlog', 'manageGallery', 'manageProducts',
        'manageServices', 'viewAnalytics', 'manageUsers', 'manageSettings',
      ];
      for (const perm of staffPerms) {
        expect(hasPermission('CLIENT', perm)).toBe(false);
      }
    });
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('UNKNOWN' as any, 'anything')).toBe(false);
  });

  it('returns false for empty permission string', () => {
    expect(hasPermission('CLIENT', '')).toBe(false);
  });

  it('is case sensitive with permission names', () => {
    expect(hasPermission('CLIENT', 'bookappointments')).toBe(false);
    expect(hasPermission('CLIENT', 'BookAppointments')).toBe(false);
  });
});
