/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the RaaJS source code
const raaSource = fs.readFileSync(path.join(__dirname, '../engine/raa.js'), 'utf-8');

// Evaluate the source in the global context (jsdom provides window, document, etc.)
eval(raaSource);

describe('RaaJS Core', () => {
  beforeEach(() => {
    // Clean up the DOM before each test
    document.body.innerHTML = '';
    
    // Clear any existing apps
    if (window.RaaJS && window.RaaJS.apps) {
      Object.keys(window.RaaJS.apps).forEach(key => {
        delete window.RaaJS.apps[key];
      });
    }
  });

  describe('PRIORITY Constants', () => {
    test('should have correct priority values', () => {
      expect(global.PRIORITY.HIGH).toBe(0);
      expect(global.PRIORITY.NORMAL).toBe(1);
      expect(global.PRIORITY.LOW).toBe(2);
      expect(global.PRIORITY.IDLE).toBe(3);
    });

    test('should be frozen', () => {
      expect(Object.isFrozen(global.PRIORITY)).toBe(true);
    });
  });

  describe('ARRAY_MUTATION_METHODS', () => {
    test('should contain all array mutation methods', () => {
      const expectedMethods = [
        'push', 'pop', 'shift', 'unshift', 
        'splice', 'sort', 'reverse', 'fill', 'copyWithin'
      ];
      
      expectedMethods.forEach(method => {
        expect(global.ARRAY_MUTATION_METHODS.has(method)).toBe(true);
      });
    });
  });

  describe('RaaLiteralParser', () => {
    let parser;

    test('should parse simple object literals', () => {
      const tokens = [
        { value: '{', type: 'Punctuator' },
        { name: 'foo', type: 'Identifier' },
        { value: ':', type: 'Punctuator' },
        { value: 'bar', type: 'Literal' },
        { value: '}', type: 'Punctuator' },
        { type: 'EOF' }
      ];
      
      parser = new global.RaaLiteralParser(tokens);
      const result = parser.parse();
      
      expect(result).toEqual({ foo: 'bar' });
    });

    test('should parse nested objects', () => {
      const tokens = [
        { value: '{', type: 'Punctuator' },
        { name: 'outer', type: 'Identifier' },
        { value: ':', type: 'Punctuator' },
        { value: '{', type: 'Punctuator' },
        { name: 'inner', type: 'Identifier' },
        { value: ':', type: 'Punctuator' },
        { value: 42, type: 'Literal' },
        { value: '}', type: 'Punctuator' },
        { value: '}', type: 'Punctuator' },
        { type: 'EOF' }
      ];
      
      parser = new global.RaaLiteralParser(tokens);
      const result = parser.parse();
      
      expect(result).toEqual({ outer: { inner: 42 } });
    });

    test('should parse arrays', () => {
      const tokens = [
        { value: '[', type: 'Punctuator' },
        { value: 1, type: 'Literal' },
        { value: ',', type: 'Punctuator' },
        { value: 2, type: 'Literal' },
        { value: ',', type: 'Punctuator' },
        { value: 3, type: 'Literal' },
        { value: ']', type: 'Punctuator' },
        { type: 'EOF' }
      ];
      
      parser = new global.RaaLiteralParser(tokens);
      const result = parser.parse();
      
      expect(result).toEqual([1, 2, 3]);
    });

    test('should throw error on unexpected token', () => {
      const tokens = [
        { value: '{', type: 'Punctuator' },
        { value: '}', type: 'Punctuator' },
        { value: 'extra', type: 'Literal' },
        { type: 'EOF' }
      ];
      
      parser = new global.RaaLiteralParser(tokens);
      
      expect(() => parser.parse()).toThrow('Unexpected token');
    });

    test('should handle empty objects', () => {
      const tokens = [
        { value: '{', type: 'Punctuator' },
        { value: '}', type: 'Punctuator' },
        { type: 'EOF' }
      ];
      
      parser = new global.RaaLiteralParser(tokens);
      const result = parser.parse();
      
      expect(result).toEqual({});
    });

    test('should handle empty arrays', () => {
      const tokens = [
        { value: '[', type: 'Punctuator' },
        { value: ']', type: 'Punctuator' },
        { type: 'EOF' }
      ];
      
      parser = new global.RaaLiteralParser(tokens);
      const result = parser.parse();
      
      expect(result).toEqual([]);
    });
  });

  describe('levenshtein distance', () => {
    test('should calculate distance between identical strings', () => {
      expect(global.levenshtein('abc', 'abc')).toBe(0);
    });

    test('should calculate distance between different strings', () => {
      expect(global.levenshtein('kitten', 'sitting')).toBe(3);
    });

    test('should handle empty strings', () => {
      expect(global.levenshtein('', 'abc')).toBe(3);
      expect(global.levenshtein('abc', '')).toBe(3);
    });

    test('should handle single character differences', () => {
      expect(global.levenshtein('cat', 'bat')).toBe(1);
      expect(global.levenshtein('cat', 'cut')).toBe(1);
    });
  });

  describe('suggestClosest', () => {
    test('should find closest match within threshold', () => {
      const candidates = ['name', 'age', 'email', 'address'];
      
      expect(global.suggestClosest('nam', candidates)).toBe('name');
      expect(global.suggestClosest('emai', candidates)).toBe('email');
    });

    test('should return null for distant matches', () => {
      const candidates = ['name', 'age', 'email'];
      
      expect(global.suggestClosest('xyz', candidates)).toBeNull();
    });

    test('should return null for empty candidates', () => {
      expect(global.suggestClosest('test', [])).toBeNull();
    });
  });

  describe('RaaJS Class', () => {
    let raa;

    beforeEach(() => {
      raa = new RaaJS();
    });

    test('should initialize with default config', () => {
      expect(raa.globalStore).toEqual({});
      expect(raa.rootSelector).toBe('[raa-core\\\\:app]');
      expect(raa.debug).toBe(false);
    });

    test('should initialize with custom config', () => {
      const customStore = { user: 'test' };
      const customRaa = new RaaJS({
        store: customStore,
        rootSelector: '[data-app]',
        debug: true
      });

      expect(customRaa.globalStore).toBe(customStore);
      expect(customRaa.rootSelector).toBe('[data-app]');
      expect(customRaa.debug).toBe(true);
    });

    test('should have safe globals defined', () => {
      expect(raa._safeGlobals.Math).toBe(Math);
      expect(raa._safeGlobals.JSON).toBe(JSON);
      expect(raa._safeGlobals.Array).toBe(Array);
      expect(raa._safeGlobals.Promise).toBe(Promise);
    });

    test('should expose blocked call properties', () => {
      expect(raa._blockedCallProps).toContain('constructor');
      expect(raa._blockedCallProps).toContain('__proto__');
      expect(raa._blockedCallProps).toContain('prototype');
    });
  });

  describe('RaaJS.define', () => {
    test('should register app factory', () => {
      const factory = () => ({ data: { count: 0 } });
      
      RaaJS.define('testApp', factory);
      
      expect(RaaJS.apps.testApp).toBe(factory);
    });

    test('should throw error for invalid app name', () => {
      expect(() => RaaJS.define('', () => ({}))).toThrow('App name must be a non-empty string');
      expect(() => RaaJS.define(123, () => ({}))).toThrow('App name must be a non-empty string');
    });

    test('should throw error for invalid factory', () => {
      expect(() => RaaJS.define('app', {})).toThrow('App factory must be a function');
      expect(() => RaaJS.define('app', null)).toThrow('App factory must be a function');
    });
  });

  describe('RaaJS instance methods', () => {
    let raa;

    beforeEach(() => {
      raa = new RaaJS();
    });

    describe('use', () => {
      test('should call plugin with raa instance', () => {
        const pluginMock = jest.fn();
        
        raa.use(pluginMock);
        
        expect(pluginMock).toHaveBeenCalledWith(raa);
      });
    });

    describe('mount', () => {
      test('should compile root when target is element', () => {
        const div = document.createElement('div');
        div.setAttribute('raa-core:app', '');
        document.body.appendChild(div);
        
        const compileRootSpy = jest.spyOn(raa, 'compileRoot');
        
        raa.mount(div);
        
        expect(compileRootSpy).toHaveBeenCalledWith(div);
        
        compileRootSpy.mockRestore();
      });

      test('should compile root when target is selector string', () => {
        const div = document.createElement('div');
        div.setAttribute('raa-core:app', '');
        div.id = 'test-app';
        document.body.appendChild(div);
        
        const compileRootSpy = jest.spyOn(raa, 'compileRoot');
        
        raa.mount('#test-app');
        
        expect(compileRootSpy).toHaveBeenCalledWith(div);
        
        compileRootSpy.mockRestore();
      });

      test('should do nothing when target is null', () => {
        const compileRootSpy = jest.spyOn(raa, 'compileRoot');
        
        raa.mount(null);
        
        expect(compileRootSpy).not.toHaveBeenCalled();
        
        compileRootSpy.mockRestore();
      });
    });

    describe('nextTick', () => {
      test('should resolve promise on next microtask', async () => {
        let executed = false;
        
        const promise = raa.nextTick(() => {
          executed = true;
        });
        
        expect(executed).toBe(false);
        
        await promise;
        
        expect(executed).toBe(true);
      });

      test('should resolve without callback', async () => {
        const promise = raa.nextTick();
        
        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe('effect', () => {
      test('should create and run effect', () => {
        const fn = jest.fn();
        
        const effect = raa.effect(fn);
        
        expect(effect.active).toBe(true);
        expect(effect.fn).toBe(fn);
        expect(fn).toHaveBeenCalled();
      });

      test('should track dependencies', () => {
        const state = { count: 0 };
        let accessCount = 0;
        
        raa.effect(() => {
          raa.track(state, 'count');
          accessCount++;
        });
        
        expect(accessCount).toBe(1);
      });
    });

    describe('track and trigger', () => {
      test('should track property access', () => {
        const obj = { value: 1 };
        const effectFn = jest.fn();
        
        raa.effect(() => {
          raa.track(obj, 'value');
          effectFn();
        });
        
        expect(effectFn).toHaveBeenCalledTimes(1);
      });

      test('should trigger effects on property change', () => {
        const obj = { value: 1 };
        let currentValue;
        
        raa.effect(() => {
          raa.track(obj, 'value');
          currentValue = obj.value;
        });
        
        expect(currentValue).toBe(1);
        
        obj.value = 2;
        raa.trigger(obj, 'value');
        
        // Effect should be scheduled to re-run
        expect(raa._pendingEffects.size).toBeGreaterThan(0);
      });
    });

    describe('isReactiveCandidate', () => {
      test('should return true for plain objects', () => {
        expect(raa.isReactiveCandidate({})).toBe(true);
        expect(raa.isReactiveCandidate({ key: 'value' })).toBe(true);
      });

      test('should return true for arrays', () => {
        expect(raa.isReactiveCandidate([])).toBe(true);
        expect(raa.isReactiveCandidate([1, 2, 3])).toBe(true);
      });

      test('should return false for primitives', () => {
        expect(raa.isReactiveCandidate(null)).toBe(false);
        expect(raa.isReactiveCandidate(undefined)).toBe(false);
        expect(raa.isReactiveCandidate(42)).toBe(false);
        expect(raa.isReactiveCandidate('string')).toBe(false);
        expect(raa.isReactiveCandidate(true)).toBe(false);
      });

      test('should return false for functions', () => {
        expect(raa.isReactiveCandidate(() => {})).toBe(false);
        expect(raa.isReactiveCandidate(function() {})).toBe(false);
      });

      test('should return false for Date objects', () => {
        expect(raa.isReactiveCandidate(new Date())).toBe(false);
      });

      test('should return false for RegExp objects', () => {
        expect(raa.isReactiveCandidate(/test/)).toBe(false);
      });
    });

    describe('sanitizeHTML', () => {
      test('should remove script tags', () => {
        const input = '<script>alert("xss")</script><p>Safe</p>';
        const result = raa.sanitizeHTML(input);
        
        expect(result).not.toContain('<script>');
        expect(result).toContain('Safe');
      });

      test('should remove event handlers', () => {
        const input = '<div onclick="alert(1)">Click</div>';
        const result = raa.sanitizeHTML(input);
        
        expect(result).not.toContain('onclick');
      });

      test('should allow safe HTML', () => {
        const input = '<p class="test">Hello <strong>World</strong></p>';
        const result = raa.sanitizeHTML(input);
        
        expect(result).toContain('<p>');
        expect(result).toContain('<strong>');
        expect(result).toContain('Hello');
        expect(result).toContain('World');
      });
    });

    describe('parseAST', () => {
      test('should tokenize simple expression', () => {
        const tokens = raa._tokenize('user.name');
        
        expect(tokens.length).toBeGreaterThan(0);
        expect(tokens.some(t => t.name === 'user')).toBe(true);
        expect(tokens.some(t => t.name === 'name')).toBe(true);
      });

      test('should tokenize string literals', () => {
        const tokens = raa._tokenize("'hello'");
        
        expect(tokens.some(t => t.type === 'Literal' && t.value === 'hello')).toBe(true);
      });

      test('should tokenize numbers', () => {
        const tokens = raa._tokenize('42');
        
        expect(tokens.some(t => t.type === 'Literal' && t.value === 42)).toBe(true);
      });

      test('should tokenize boolean literals', () => {
        const tokensTrue = raa._tokenize('true');
        const tokensFalse = raa._tokenize('false');
        
        expect(tokensTrue.some(t => t.type === 'Literal' && t.value === true)).toBe(true);
        expect(tokensFalse.some(t => t.type === 'Literal' && t.value === false)).toBe(true);
      });
    });

    describe('evaluateAST', () => {
      test('should evaluate simple property access', () => {
        const context = { user: { name: 'John' } };
        const result = raa.evaluateAST('user.name', context);
        
        expect(result).toBe('John');
      });

      test('should evaluate arithmetic expressions', () => {
        const context = { a: 5, b: 3 };
        const result = raa.evaluateAST('a + b', context);
        
        expect(result).toBe(8);
      });

      test('should evaluate comparison expressions', () => {
        const context = { x: 10, y: 5 };
        const result = raa.evaluateAST('x > y', context);
        
        expect(result).toBe(true);
      });

      test('should evaluate logical expressions', () => {
        const context = { a: true, b: false };
        
        expect(raa.evaluateAST('a && b', context)).toBe(false);
        expect(raa.evaluateAST('a || b', context)).toBe(true);
      });

      test('should evaluate ternary expressions', () => {
        const context = { condition: true, a: 1, b: 2 };
        
        expect(raa.evaluateAST('condition ? a : b', context)).toBe(1);
        
        context.condition = false;
        expect(raa.evaluateAST('condition ? a : b', context)).toBe(2);
      });

      test('should evaluate array access', () => {
        const context = { items: [10, 20, 30] };
        
        expect(raa.evaluateAST('items[0]', context)).toBe(10);
        expect(raa.evaluateAST('items[1]', context)).toBe(20);
      });

      test('should evaluate method calls on safe objects', () => {
        const context = { text: 'hello' };
        
        expect(raa.evaluateAST('text.toUpperCase()', context)).toBe('HELLO');
      });

      test('should block constructor access', () => {
        const context = { obj: {} };
        
        expect(() => raa.evaluateAST('obj.constructor', context)).toThrow();
      });

      test('should block __proto__ access', () => {
        const context = { obj: {} };
        
        expect(() => raa.evaluateAST('obj.__proto__', context)).toThrow();
      });
    });
  });

  describe('DOM Integration', () => {
    let raa;

    beforeEach(() => {
      document.body.innerHTML = '';
      raa = new RaaJS();
    });

    test('should initialize with DOM observer', () => {
      expect(raa._domObserver).toBeDefined();
    });

    test('should observe document for changes', () => {
      expect(raa.observeDocument).toBeDefined();
      expect(typeof raa.observeDocument).toBe('function');
    });

    test('should have directive cache', () => {
      expect(raa._directiveCache).toBeDefined();
    });

    test('should have reactive cache', () => {
      expect(raa._reactiveCache).toBeDefined();
    });

    test('should have AST cache', () => {
      expect(raa._astCache).toBeDefined();
    });
  });

  describe('Global Exposure', () => {
    test('should expose RaaJS to window', () => {
      expect(window.RaaJS).toBeDefined();
      expect(window.RaaJS).toBe(RaaJS);
    });

    test('should have apps registry on RaaJS', () => {
      expect(RaaJS.apps).toBeDefined();
      expect(typeof RaaJS.apps).toBe('object');
    });

    test('should have define method on RaaJS', () => {
      expect(RaaJS.define).toBeDefined();
      expect(typeof RaaJS.define).toBe('function');
    });
  });

  describe('Scheduler', () => {
    let raa;

    beforeEach(() => {
      raa = new RaaJS();
    });

    test('should schedule effect', () => {
      const fn = jest.fn();
      const effect = { fn, active: true, deps: new Set(), cleanup: [] };
      
      raa.scheduleEffect(effect);
      
      expect(raa._pendingEffects.has(effect)).toBe(true);
    });

    test('should flush pending effects', () => {
      let runCount = 0;
      const effect = {
        fn: () => runCount++,
        active: true,
        deps: new Set(),
        cleanup: [],
        root: null
      };
      
      raa.scheduleEffect(effect);
      raa.flushEffects();
      
      expect(runCount).toBeGreaterThan(0);
    });

    test('should prevent infinite loops with max effect runs', () => {
      expect(raa._maxEffectRunsPerFlush).toBe(50);
    });
  });

  describe('Error Handling', () => {
    let raa;

    beforeEach(() => {
      raa = new RaaJS({ debug: true });
    });

    test('should have warn method', () => {
      expect(raa.warn).toBeDefined();
      expect(typeof raa.warn).toBe('function');
    });

    test('should have error method', () => {
      expect(raa.error).toBeDefined();
      expect(typeof raa.error).toBe('function');
    });

    test('should log warning with code', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      raa.warn('TEST_CODE', 'Test warning message');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[RaaJS warn:TEST_CODE]'));
      
      consoleWarnSpy.mockRestore();
    });

    test('should log error with code', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      raa.error('TEST_CODE', 'Test error message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[RaaJS error:TEST_CODE]'));
      
      consoleErrorSpy.mockRestore();
    });
  });
});
