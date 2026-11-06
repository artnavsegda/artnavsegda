import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { startWorker } from './lib/state.svelte';

startWorker();

export default mount(App, { target: document.getElementById('app')! });
