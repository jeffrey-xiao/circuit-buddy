<template>
    <div v-bind:id="'tab-' + tabId" class="tab" v-bind:class="{active: isActive}" v-on:click="setActive">
        <span>{{name}}</span>
        <button v-bind:id="'delete-tab-' + tabId" v-on:click="deleteTab">
            <i class="el el-remove"></i>
        </button>
    </div>
</template>

<script>
	var Main = require("../lib/main.js");

	module.exports = {
		props: ['tabId', 'currActive', 'name'],
		data: function () {
			return {};
		},
		computed: {
			isActive: function () {
				return this.currActive == this.tabId;
			}
		},
		methods: {
			setActive: function (event) {
				Main.Events.$emit('tabs:set-active', event, this.tabId);
			},
			deleteTab: function () {
				Main.Events.$emit('tabs:delete-tab', event, this.tabId);
			}
		}
	};
</script>