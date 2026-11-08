import { mount } from 'svelte';
import './themes.css';
import './brutal.css';
import './nordic.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
