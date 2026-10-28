declare module '*.mdx' {
  import type { MDXProps } from 'mdx/types'
  const MDXComponent: (props: MDXProps) => React.ReactNode
  export default MDXComponent
}
