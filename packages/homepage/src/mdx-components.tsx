import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { Text } from 'retro-react'
import type { ComponentPropsWithoutRef } from 'react'

function Heading({
  variant,
  children,
  ...props
}: {
  variant: 'h1' | 'h2' | 'h3' | 'h4'
  children?: React.ReactNode
} & ComponentPropsWithoutRef<'div'>) {
  return (
    <Text
      variant={variant}
      sx={{ marginTop: variant === 'h1' ? 0 : '1.25rem', marginBottom: '0.5rem' }}
      {...props}
    >
      {children}
    </Text>
  )
}

const components: MDXComponents = {
  h1: (props) => <Heading variant="h1" {...props} />,
  h2: (props) => <Heading variant="h2" {...props} />,
  h3: (props) => <Heading variant="h3" {...props} />,
  h4: (props) => <Heading variant="h4" {...props} />,
  p: (props) => (
    <Text variant="paragraph" sx={{ marginBottom: '0.75rem', lineHeight: 1.55 }} {...props} />
  ),
  a: ({ href, children, ...props }) => {
    const to = href ?? '#'
    if (to.startsWith('/')) {
      return (
        <Link href={to} {...props}>
          {children}
        </Link>
      )
    }
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  },
  ul: (props) => (
    <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem' }} {...props} />
  ),
  ol: (props) => (
    <ol style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem' }} {...props} />
  ),
  li: (props) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
  code: (props) => (
    <code
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.9em',
        background: '#fff',
        border: '1px solid #808080',
        padding: '0 0.25rem',
      }}
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      style={{
        margin: '0 0 1rem',
        padding: '10px 12px',
        overflow: 'auto',
        background: '#000080',
        color: '#fff',
        border: '2px solid',
        borderColor: '#808080 #fff #fff #808080',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.45,
      }}
      {...props}
    />
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
