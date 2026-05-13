import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/sanitize-html';

describe('sanitizeHtml', () => {
  it('returns empty string for null', () => {
    expect(sanitizeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('preserves plain text', () => {
    expect(sanitizeHtml('Hello world')).toBe('Hello world');
  });

  it('preserves safe HTML tags', () => {
    const input = '<p>Hello</p><strong>bold</strong><em>italic</em>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  describe('script tag handling', () => {
    it('removes inline script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
    });

    it('removes script tags with nested content', () => {
      const input = '<script>if (1 < 2) { doSomething(); }</script><p>safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });

    it('removes script tags with attributes', () => {
      const input = '<script src="https://evil.com/hack.js" async></script><p>safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });

    it('handles uppercase SCRIPT tags', () => {
      const input = '<SCRIPT>alert("xss")</SCRIPT><p>safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });

    it('handles mixed case script tags', () => {
      const input = '<ScRiPt>alert(1)</ScRiPt><p>safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });
  });

  describe('dangerous tag removal', () => {
    const tags = ['iframe', 'object', 'embed', 'applet', 'form', 'base', 'link'];

    for (const tag of tags) {
      it(`removes <${tag}> tags`, () => {
        const input = `<${tag}>content</${tag}><p>safe</p>`;
        expect(sanitizeHtml(input)).toBe('<p>safe</p>');
      });

      it(`removes self-closing <${tag}> tags`, () => {
        const input = `<${tag} src="https://evil.com" /><p>safe</p>`;
        expect(sanitizeHtml(input)).toBe('<p>safe</p>');
      });
    }
  });

  describe('style tag removal', () => {
    it('removes style tags and content', () => {
      const input = '<style>body { color: red; }</style><p>safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });

    it('removes style tags with attributes', () => {
      const input = '<style type="text/css">.cls { }</style><p>safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });
  });

  describe('event handler removal', () => {
    it('removes onclick handlers', () => {
      const input = '<button onclick="alert(1)">Click</button>';
      expect(sanitizeHtml(input)).toBe('<button>Click</button>');
    });

    it('removes onerror handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      expect(sanitizeHtml(input)).toBe('<img src="x">');
    });

    it('removes onload handlers', () => {
      const input = '<body onload="init()">content</body>';
      expect(sanitizeHtml(input)).toBe('<body>content</body>');
    });

    it('removes multiple event handlers', () => {
      const input = '<div onclick="a()" onmouseover="b()" onload="c()">text</div>';
      expect(sanitizeHtml(input)).toBe('<div>text</div>');
    });

    it('removes handlers with single quotes', () => {
      const input = "<button onclick='alert(1)'>Click</button>";
      expect(sanitizeHtml(input)).toBe('<button>Click</button>');
    });
  });

  describe('javascript: URL removal', () => {
    it('strips javascript: from href', () => {
      const input = '<a href="javascript:alert(1)">link</a>';
      expect(sanitizeHtml(input)).toBe('<a href="">link</a>');
    });

    it('strips javascript: from src', () => {
      const input = '<iframe src="javascript:void(0)"></iframe>';
      expect(sanitizeHtml(input)).toBe('');
    });

    it('strips data: URLs from href', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">link</a>';
      expect(sanitizeHtml(input)).toBe('<a href="">link</a>');
    });
  });

  describe('meta refresh removal', () => {
    it('removes meta refresh tags', () => {
      const input = '<meta http-equiv="refresh" content="0;url=https://evil.com"><p>safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });

    it('removes meta refresh with single quotes', () => {
      const input = "<meta http-equiv='refresh' content='0;url=evil'><p>safe</p>";
      expect(sanitizeHtml(input)).toBe('<p>safe</p>');
    });
  });

  describe('complex XSS payloads', () => {
    it('handles nested script in attribute bypass', () => {
      const input = '<p>safe</p><img src=x onerror="<script>alert(1)</script>">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
      expect(result).toContain('<p>safe</p>');
    });

    it('handles multiple dangerous elements', () => {
      const input = `
        <p>Welcome</p>
        <script>bad()</script>
        <iframe src="evil"></iframe>
        <style>body{background:red}</style>
        <img src="x" onerror="hack()">
        <a href="javascript:void(0)">click</a>
      `;
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>Welcome</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('javascript:');
    });

    it('preserves nested safe tags', () => {
      const input = '<div><p><strong>Bold</strong> and <em>italic</em></p><ul><li>item</li></ul></div>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('preserves blockquote with cite', () => {
      const input = '<blockquote cite="https://example.com">Quote</blockquote>';
      expect(sanitizeHtml(input)).toBe(input);
    });
  });
});
