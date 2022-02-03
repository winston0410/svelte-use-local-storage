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

type ValueSetterArgs<T extends PersistableElement> = {
  node: T;
  name: string;
  initValue: string;
};

type ValueSetter<T extends PersistableElement> = (
  args: ValueSetterArgs<T>
) => void;

const setInput: ValueSetter<InputElement> = ({ node, name, initValue }) => {
  const saved = localStorage.getItem(name);
  if (initValue) {
    node.value = initValue;
  } else {
    node.value = saved;
  }
};

// TODO Should exclude InputElement and GroupElement here from the HTMLElement type
const setInnerHTML: ValueSetter<HTMLElement> = ({ node, name, initValue }) => {
  const saved = localStorage.getItem(name);
  if (initValue) {
    node.textContent = initValue;
  } else {
    node.textContent = saved;
  }
};

// TODO Handle initValue for radiogroup
const setRadio: ValueSetter<GroupElement> = ({ node, name, initValue }) => {
  const savedKey = localStorage.getItem(name);
  const targetButton = ([...node.elements] as Array<HTMLInputElement>).find(
    (x) => x.value === savedKey
  );

  if (targetButton) {
    targetButton.checked = true;
  }
};

type HandlerSetter<T extends PersistableElement> = (
  args: Omit<ValueSetterArgs<T>, "initValue">
) => void;

const mountInputElementHandler: HandlerSetter<InputElement | GroupElement> = ({
  node,
  name,
}) => {
  const handleChange = (e: InputEvent) => {
    localStorage.setItem(name, (e.target as HTMLInputElement).value);
  };

  node.addEventListener("change", handleChange);

  return {
    destroy() {
      node.removeEventListener("change", handleChange);
    },
  };
};

const mountNormalElementHandler: HandlerSetter<HTMLElement> = ({
  node,
  name,
}) => {
  const observer = new MutationObserver(function () {
    localStorage.setItem(name, node.textContent);
  });

  // REF https://stackoverflow.com/questions/40195514/mutation-observer-not-detecting-text-change
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

type ActionProps = {
  name: string;
  // NOTE initial value to set on target element
  initValue?: string;
};

const defaultOpts = {
  initValue: "",
};

const useLocalStorage: Action<PersistableElement, ActionProps> = (
  node,
  opts
) => {
  if (!storageOk("localStorage")) {
    console.warn("localStorage is not supported by the current browser.");
    return;
  }

  const { name, initValue } = { ...defaultOpts, ...opts };

  switch (node.tagName.toLowerCase()) {
    case "fieldset":
      setRadio({ node: node as GroupElement, name, initValue });
      node.dispatchEvent(new Event("input"));
      node.dispatchEvent(new Event("change"));
      return mountInputElementHandler({ node: node as GroupElement, name });

    case "input":
    case "textarea":
      setInput({ node: node as InputElement, name, initValue });
      node.dispatchEvent(new Event("input"));
      node.dispatchEvent(new Event("change"));
      return mountInputElementHandler({ node: node as InputElement, name });

    // NOTE For all other HTML elements
    default:
      setInnerHTML({ node: node as HTMLElement, name, initValue });
      // TODO Find the correct event to dispatch here
      return mountNormalElementHandler({ node: node as HTMLElement, name });
  }
};

export default useLocalStorage;
