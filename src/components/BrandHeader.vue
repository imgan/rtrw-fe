<script setup>
import { ShieldCheck } from '@lucide/vue';
</script>

<template>
  <div class="brand">
    <div class="brand__logo"><ShieldCheck :size="22" /></div>
    <div>
      <div class="brand__title">RT 04 / RW 08 Sukamaju</div>
      <div class="brand__sub">
        Kel. Cilodong, Kec. Cilodong, Kota Depok
        <span class="brand__app"><span class="dot" /> Sistem Warga Harmoni</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.brand { display: flex; align-items: center; gap: 12px; }
.brand__logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.brand__title { font-weight: 700; font-size: 20px; color: var(--primary); letter-spacing: -0.02em; }
.brand__sub { font-size: 13px; color: var(--muted); display: flex; flex-wrap: wrap; gap: 4px 8px; }
.brand__app { color: var(--primary); display: inline-flex; align-items: center; gap: 6px; }
.brand__app .dot { width: 6px; height: 6px; }
</style>
