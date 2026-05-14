@echo off
title GLB Cache Builder
echo 正在将 assets/*.glb 转为 glb_cache.js ...
echo.
python "%~dp0build_glb_cache.py"
