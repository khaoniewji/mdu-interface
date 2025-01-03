// src/lib/mducore/user-agents.ts

export interface UserAgentInfo {
    name: string;
    value: string;
    platform: 'desktop' | 'mobile' | 'tablet';
    os: 'windows' | 'macos' | 'linux' | 'android' | 'ios';
  }
  
  export const USER_AGENTS: UserAgentInfo[] = [
    // Chrome
    {
      name: 'Chrome Windows',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      platform: 'desktop',
      os: 'windows'
    },
    {
      name: 'Chrome macOS',
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      platform: 'desktop',
      os: 'macos'
    },
    {
      name: 'Chrome Linux',
      value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      platform: 'desktop',
      os: 'linux'
    },
    {
      name: 'Chrome Android',
      value: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      platform: 'mobile',
      os: 'android'
    },
    {
      name: 'Chrome iOS',
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
      platform: 'mobile',
      os: 'ios'
    },
  
    // Firefox
    {
      name: 'Firefox Windows',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      platform: 'desktop',
      os: 'windows'
    },
    {
      name: 'Firefox macOS',
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
      platform: 'desktop',
      os: 'macos'
    },
    {
      name: 'Firefox Linux',
      value: 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
      platform: 'desktop',
      os: 'linux'
    },
    {
      name: 'Firefox Android',
      value: 'Mozilla/5.0 (Android 10; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
      platform: 'mobile',
      os: 'android'
    },
    {
      name: 'Firefox iOS',
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15',
      platform: 'mobile',
      os: 'ios'
    },
  
    // Safari
    {
      name: 'Safari macOS',
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      platform: 'desktop',
      os: 'macos'
    },
    {
      name: 'Safari iOS',
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      platform: 'mobile',
      os: 'ios'
    },
    {
      name: 'Safari iPad',
      value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      platform: 'tablet',
      os: 'ios'
    },
  
    // Edge
    {
      name: 'Edge Windows',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      platform: 'desktop',
      os: 'windows'
    },
    {
      name: 'Edge macOS',
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      platform: 'desktop',
      os: 'macos'
    },
  
    // Opera
    {
      name: 'Opera Windows',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
      platform: 'desktop',
      os: 'windows'
    },
    {
      name: 'Opera Android',
      value: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 OPR/73.0.3844.0',
      platform: 'mobile',
      os: 'android'
    }
  ];
  
  export class UserAgentSelector {
    private static instance: UserAgentSelector;
    private currentIndex: number = 0;
  
    private constructor() {}
  
    static getInstance(): UserAgentSelector {
      if (!this.instance) {
        this.instance = new UserAgentSelector();
      }
      return this.instance;
    }
  
    getRandomUserAgent(): UserAgentInfo {
      return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }
  
    getNextUserAgent(): UserAgentInfo {
      const agent = USER_AGENTS[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % USER_AGENTS.length;
      return agent;
    }
  
    getUserAgentByPlatform(platform: UserAgentInfo['platform']): UserAgentInfo {
      const agents = USER_AGENTS.filter(agent => agent.platform === platform);
      return agents[Math.floor(Math.random() * agents.length)];
    }
  
    getUserAgentByOS(os: UserAgentInfo['os']): UserAgentInfo {
      const agents = USER_AGENTS.filter(agent => agent.os === os);
      return agents[Math.floor(Math.random() * agents.length)];
    }
  
    getUserAgentByBrowser(browserName: string): UserAgentInfo | undefined {
      return USER_AGENTS.find(agent => agent.name.toLowerCase().includes(browserName.toLowerCase()));
    }
  }