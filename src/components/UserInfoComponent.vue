<template>
  <div class="user-info">
    <div class="card">
      <div class="header-bg" id="header-blur">
        <img width="250" height="70" :src="'https://twivatar.glitch.me/' + user.username" alt=""/>
      </div>
      <div class="avatar">
        <img :src="'https://twivatar.glitch.me/' + user.username" alt=""/>
      </div>
      <div class="content">
        <p>@{{ user.username }}</p>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: ['user']
  };
</script>

<style>
  .user-info {
    width: 200px;
    padding: 20px;
  }

  .card {
    overflow: hidden;
    position: relative;
    border: 1px solid #CCC;
    border-radius: 8px;
    text-align: center;
    padding: 0;
  }

  .card .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 70px;
    border-bottom: 1px #FFF solid;
    z-index: 1;
    overflow: hidden;
  }

  .card .header-bg img {
    filter: blur(10px);
  }

  .card .avatar {
    position: relative;
    margin-top: 15px;
    z-index: 100;
  }

  .card .avatar img {
    width: 100px;
    height: 100px;
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    border-radius: 50%;
    border: 1px solid white;
  }
</style>
