/**
 * The return type of an action.
 */
export type ActionReturn<Params> = {
  destroy?: () => void;
  update?: (params: Params) => void;
} | void;

/**
 * Action type shim
 */
export type ActionLike<Node extends HTMLElement> = (
  node: Node,
  params: unknown
) => unknown;

/**
 * A primitive Action
 */
export type Action<
  Node extends HTMLElement = HTMLElement,
  Params extends unknown = undefined
> = (node: Node, params?: Params) => ActionReturn<Params>;

const useLocalStorage: Action = (node, keyName: string) => {
  if (!(node instanceof HTMLInputElement)) {
      return
  }
    
  const saved = localStorage.getItem(keyName)
  node.value = saved

  const handleChange = (e: InputEvent) => {
      localStorage.setItem(keyName, (e.target as HTMLInputElement).value)
  }
  
  node.addEventListener('change', handleChange)
  
  return {
    destroy() {
        node.removeEventListener('change', handleChange)
    },
  };
};

export default useLocalStorage
