import { describe, it, strict } from 'poku';
import { selectAgent } from '../../../src/cli/select-agent.js';

await describe('selecting an agent with no agent argument (non-interactive)', async () => {
  await it('refuses instead of prompting', async () => {
    await strict.rejects(
      selectAgent(undefined, [], {
        isInteractive: () => false,
        promptForAgent: () =>
          Promise.reject(new Error('should not prompt without a TTY')),
      }),
      /No agent selected/,
      'it should refuse without an agent'
    );
  });
});

await describe('selecting an agent interactively', async () => {
  await it('resolves the provider from the chosen key', async () => {
    let offered: { key: string; displayName: string }[] = [];
    let offeredInstalled: string[] = [];

    const provider = await selectAgent(undefined, ['copilot'], {
      isInteractive: () => true,
      promptForAgent: (agents, installed) => {
        offered = agents;
        offeredInstalled = installed;
        return Promise.resolve('claude');
      },
    });

    strict.strictEqual(provider.key, 'claude', 'it resolves the chosen agent');
    strict.deepStrictEqual(
      offeredInstalled,
      ['copilot'],
      'the installed agents are forwarded to the picker'
    );
    strict(
      offered.every(
        (agent) =>
          typeof agent.key === 'string' && typeof agent.displayName === 'string'
      ),
      'every offered agent carries a key and a display name'
    );

    const offeredKeys = offered.map((agent) => agent.key);
    for (const expectedKey of [
      'claude',
      'copilot',
      'codex',
      'gemini',
      'goose',
      'forge',
    ]) {
      strict(
        offeredKeys.includes(expectedKey),
        `the picker should offer ${expectedKey}`
      );
    }
  });

  await it('propagates an aborted selection', async () => {
    await strict.rejects(
      selectAgent(undefined, [], {
        isInteractive: () => true,
        promptForAgent: () =>
          Promise.reject(new Error('No agent selected: cancelled.')),
      }),
      /cancelled/,
      'aborting the picker should surface as an error'
    );
  });
});
