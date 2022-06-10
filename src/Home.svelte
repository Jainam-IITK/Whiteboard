

<script lang="typescript">
    
    //import {Link} from 'svelte-navigator';
    import {link} from 'svelte-spa-router'

    import firebase from 'firebase/app';
    import 'firebase/firestore';
    import { onMount } from 'svelte';
    import {isInitiator} from './stores';
    import VideoSetup from './VideoRoom/VideoSetup.svelte';
    import Toast from './UIUtils/Toast.svelte'
  
    isInitiator.set(true);
    let startMeetingButton;
    let arePermissionsGranted = false;
    
    let id = null;
    onMount(()=>{
        const firestore = firebase.firestore();
        const callDoc = firestore.collection('calls').doc();

       
        id =  callDoc.id;
    })

  </script> 
  

 


  <div class="container">
    
    <div>
      <VideoSetup bind:arePermissionsGranted = {arePermissionsGranted} />
    </div>
    <br>
    
    <div>
      {#if id != null}
      <a href= {`/${id}`}  use:link>
        <button bind:this = {startMeetingButton} class:tw = {true} disabled = '{!arePermissionsGranted}'>Start the Meeting</button>
      </a>  
      {:else}
      <p>Loading...</p>
      {/if}
    </div>

    <div>
      <Toast/>
    </div>


  </div>

  
  <style>
    
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      position : absolute;
      top: 0%;
      left: 0%;
      width:100%;
      height:100%;
      
    }

   
    .tw {
      /* Auto Layout */
      cursor: pointer;
      width: 200px;
      height: 48px;
      border:0px;
      border-radius: 3px;

      /* Black */

      background: #0F172A;
    
      
      /*font*/
      /* Body / Bold */

      font-family: Inter;
      font-style: normal;
      font-weight: bold;
      font-size: 16px;
      line-height: 24px;

      /* identical to box height, or 150% */

      font-feature-settings: 'tnum' on, 'lnum' on;

      /* White */

      color: #FFFFFF;

    }
    
    
    .tw:disabled{
      cursor:not-allowed;
      /* Auto Layout */
      width: 200px;
      height: 48px;
      border:0px;
      border-radius: 3px;

      /* Black */

      background: #94A3B8;
    
      
      /*font*/
      /* Body / Bold */

      font-family: Inter;
      font-style: normal;
      font-weight: bold;
      font-size: 16px;
      line-height: 24px;

      /* identical to box height, or 150% */

      font-feature-settings: 'tnum' on, 'lnum' on;

      /* White */

      color: #FFFFFF;
    }
    
    .tw:active {
      background-color: #FFFFFF;
      color: #0F172A;
      transform: translateY(4px);
    }
  
  </style>