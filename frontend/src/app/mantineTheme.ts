import type { MantineThemeOverride } from '@mantine/core';

export const mantineOverrides: MantineThemeOverride = {
  primaryColor: 'grape',
  components: {
    MultiSelect: {
      classNames: {
        label: '!text-xs !text-zinc-600 !font-normal mb-2',
        input: '!py-2 !border-solid !border-[0.5px] !border-zinc-500 text-zinc-800',
        dropdown: '!outline !outline-1 !outline-purple-500',
      },
    },
    TextInput: {
      classNames: {
        label: '!text-xs !text-zinc-600 !font-normal mb-2',
        input: '!py-2 !border-zinc-500 text-zinc-800',
      },
    },
    Select: {
      classNames: {
        label: '!text-xs !text-zinc-600 !font-normal mb-0',
        input: '!py-4 !border-solid !border-[0.5px] !border-zinc-500 text-zinc-800',
        dropdown: '!outline !outline-1 !outline-purple-500',
      },
    },
    Textarea: {
      classNames: {
        label: '!text-xs !text-zinc-600 !font-normal mb-2',
        input: '!border-solid !border-[0.5px] !border-zinc-500 text-zinc-800 !bg-transparent',
        dropdown: '!outline !outline-1 !outline-purple-500',
      },
    },
    TagsInput: {
      classNames: {
        label: '!text-xs !text-zinc-600 !font-normal mb-2',
        input: '!py-2 !border-solid !border-[0.5px] !border-zinc-500 text-zinc-800',
      },
    },
  },
};
