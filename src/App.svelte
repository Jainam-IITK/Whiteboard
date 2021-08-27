<script lang="ts">
	import Video from './VideoRoom/Video.svelte';
	import Home from './Home.svelte';
	//import { Router, Link, Route } from "svelte-navigator"; 
	import Router from "svelte-spa-router";
	import {routes} from './routes'
	let name = "Jainam";
  
	import firebase from 'firebase/app';
	import 'firebase/firestore';
  
	const firebaseConfig = {
	  apiKey: "AIzaSyCEu5d0rrOw7Mi_FSdR6DDw-XVuGXim_80",
	  authDomain: "whiteboard-f4cac.firebaseapp.com",
	  projectId: "whiteboard-f4cac",
	  storageBucket: "whiteboard-f4cac.appspot.com",
	  messagingSenderId: "531838782598",
	  appId: "1:531838782598:web:323853a2ae3dddeae15507",
	  measurementId: "G-L3152V973W"
	};
  
	
	if (!firebase.apps.length) {
	  firebase.initializeApp(firebaseConfig);
	}
   
  
  </script>
   
   <body>
    <Router {routes}/>
	</body>
  
  
  
  <style>
	
  </style>
  