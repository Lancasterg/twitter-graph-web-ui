<template>
  <div>
    <section class="content">
      <router-view></router-view>
    </section>

    <footer class="footer">
      <span class="text-muted ml-3">twitter relationship visualiser <code>v1</code></span>
    </footer>
  </div>
</template>

<script>
export default {};
</script>

<style>
* {
  font-family: "Monaco", "Menlo", "Consolas", monospace;
}

html, body, .content {
  height: 100%;
}

.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 40px;
}
</style>
