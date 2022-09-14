<template>
  <div>
    <div class="input-group input-group-lg">
      <div class="input-group-prepend">
        <span class="input-group-text" id="basic-addon1">@</span>
      </div>
      <input type="text" class="form-control"
             v-model="username"
             placeholder="Enter a twitter username..."
             @keydown.enter="submit">
    </div>

    <div id="viz_wrapper">
      <div v-if="loading" class="loading-spinner h-100 d-flex">
        <div class="mx-auto align-self-center">
          <div class="hal-9000 d-block mx-auto"></div>
        </div>
      </div>

      <div class="background-logo">
        <img src="../assets/images/uob_arms_monochrome_white.png">
      </div>

      <svg id="viz" ref="viz_wrapper"></svg>
    </div>

    <user-info-component :user="hoveredUser"></user-info-component>
  </div>
</template>

<script>
  import Graph from './d3-graph';
  import UserInfoComponent from "./UserInfoComponent";

  export default {
    components: { UserInfoComponent },
    data() {
      return {
        username: 'alan',
        loading: true,
        apiRoot: process.env.VUE_APP_API_ROOT,
        graph: undefined,
        hoveredUser: {username: 'alan'},
        link: undefined,
      }
    },
    mounted() {
      this.fetchUserMentions(this.username).then((response) => {
        setTimeout(() => this.initGraph(response.data), 500);
      });
    },
    methods: {
      submit() {
        this.graph.reset();
        this.loading = true;
        this.fetchUserMentions(this.username).then((response) => {
          setTimeout(() => this.initGraph(response.data), 500);
        });
      },
      fetchUserMentions(username) {
        const uri = this.apiRoot + '/tweets?username=' + username;
        return this.axios.get(uri);
      },
      initGraph(data) {
        this.graph = new Graph("viz", data.nodes, data.links, this.username);
        this.loading = false;

        this.graph.onNodeClick(this.onNodeClick);
        this.graph.onNodeHover(this.onNodeHover);
        this.graph.onNodeHoverEnd(this.onNodeHoverEnd);
        this.graph.onLinkHover(this.onLinkHover);
        this.graph.onLinkHoverEnd(this.onLinkHoverEnd);

      },
      onNodeClick(node) {
        this.username = node.username;
        this.submit();
      },
      onNodeHover(node) {
        this.hoveredUser = node;
      },
      onNodeHoverEnd(node) {
        this.hoveredUser = {username: this.username};
      },
      onLinkHover(link) {
        this.link = link;
      },
      onLinkHoverEnd(link) {
        this.link = undefined;
      }
    },
  };
</script>

<style>
  #viz_wrapper {
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 0;
  }

  #viz {
    width: 100%;
    height: 100%;
  }

  line.link {
    stroke: #999;
    stroke-opacity: 0.6;
  }

  .node circle {
    stroke: #adabc6;
    stroke-width: 1.5px;
  }

  text {
    font-family: "Monaco", "Menlo", "Consolas", monospace;
    stroke: #adabc6;
  }

  .background-logo {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: -100;
    text-align: center;
  }

  .background-logo img {
    opacity: 0.05;
    width: 30%;
    margin: auto;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
</style>
