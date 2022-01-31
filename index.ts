// REF https://github.com/sveltejs/kit/issues/1549
// NOTE Importing cjs module is broken right now in Vite
import type { Action } from "svelte-action-type";

type GroupElement = HTMLFieldSetElement;
type InputElement = HTMLInputElement | HTMLTextAreaElement;
type PersistableElement = InputElement | GroupElement | HTMLElement;

type Storage = "localStorage" | "sessionStorage";

//  import storageOk from 'storage-available'
const storageOk = (type: Storage) => {
  try {
    const storage = window[type],
      x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

type ValueSetter<T extends PersistableElement> = (
  node: T,
  keyName: string
) => void;

const setInput: ValueSetter<InputElement> = (node, keyName) => {
  const saved = localStorage.getItem(keyName);
  node.value = saved;
};

// TODO Should exclude InputElement and GroupElement here
const setInnerHTML: ValueSetter<HTMLElement> = (node, keyName) => {
  const saved = localStorage.getItem(keyName);
  if (saved) {
    node.textContent = saved;
  }
};

const setRadio: ValueSetter<GroupElement> = (node, keyName) => {
  const savedKey = localStorage.getItem(keyName);
  const targetButton = ([...node.elements] as Array<HTMLInputElement>).find(
    (x) => x.value === savedKey
  );

  if (targetButton) {
    targetButton.checked = true;
  }
};

const mountInputElementHandler: ValueSetter<InputElement | GroupElement> = (
  node,
  keyName
) => {
  const handleChange = (e: InputEvent) => {
    localStorage.setItem(keyName, (e.target as HTMLInputElement).value);
  };

  node.addEventListener("change", handleChange);

  return {
    destroy() {
      node.removeEventListener("change", handleChange);
    },
  };
};

const mountNormalElementHandler: ValueSetter<HTMLElement> = (node, keyName) => {
  const observer = new MutationObserver(function () {
    localStorage.setItem(keyName, node.textContent);
  });

  observer.observe(node, {
    characterData: true,
    attributes: false,
    childList: false,
    subtree: true,
  });
  return {
    destroy() {
      observer.disconnect();
    },
  };
};

const useLocalStorage: Action<PersistableElement, string> = (node, keyName) => {
  if (!storageOk("localStorage")) {
    console.warn("localStorage is not supported by the current browser.");
    return;
  }

  switch (node.tagName.toLowerCase()) {
    case "fieldset":
      setRadio(node as GroupElement, keyName);
      return mountInputElementHandler(node as GroupElement, keyName);

    case "input":
    case "textarea":
      setInput(node as InputElement, keyName);
      return mountInputElementHandler(node as InputElement, keyName);

    // NOTE For all other HTML elements
    default:
      setInnerHTML(node as HTMLElement, keyName);
      return mountNormalElementHandler(node as HTMLElement, keyName);
  }
};

export default useLocalStorage;
