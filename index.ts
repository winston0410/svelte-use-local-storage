// REF https://github.com/sveltejs/kit/issues/1549
// NOTE Importing cjs module is broken right now in Vite
//  import storageOk from 'storage-available'

//  Taken from this repo, as these types should be merged to core later
//  https://github.com/paolotiu/svelte-useactions/blob/main/src/index.ts
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
  Params = unknown
> = (node: Node, params?: Params) => ActionReturn<Params>;

type InputElement = HTMLInputElement | HTMLTextAreaElement

type Storage = "localStorage" | "sessionStorage"

const storageOk = (type: Storage) => {
	try {
		var storage = window[type],
			x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	}
	catch(e) {
		return false;
	}
}

const useLocalStorage: Action<InputElement, string> = (node, keyName) => {
  if (!storageOk('localStorage')) {
      console.warn("localStorage is not supported by the current browser.")
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
