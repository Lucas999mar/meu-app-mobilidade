# Guia Oficial de Implantação de Produção 🚀

Este documento descreve os passos exatos para pegar o sistema rodando na sua máquina e empurrar para o Mundo Real (Vercel, Hostinger, e Play Store).

## 1. O Painel Admin Web (na Vercel)
O seu painel em `apps/admin` foi feito inteiramente em Next.js para ter deploy atômico nativo.
* Vá no site da **Vercel** e faça login.
* Confirme seu repoisitório Github e clique em **"Import Project"**.
* Importante: Em **"Root Directory"**, mude selecionando a pasta `apps/admin` (Pois estamos num monorepo).
* Defina as variáveis de ambiente base:
  - `NEXT_PUBLIC_API_URL` = (Url da sua VPS, Ex: `https://api.mobilidade.com.br`)
* Clique em Deploy! O Painel estará online em 1 minuto.

## 2. A API Central (na Hostinger / VPS Linux)
O "Motor Monstro" em NestJS requer Node e Banco de Dados.
* Entre na Hostinger via SSH.
* Mande os arquivos da base pra lá (via Git clone).
* Dentro da sua VPS, rode a orquestração do banco principal (que nós já construimos e está programada lá dentro): `docker-compose up -d`. Isso cria isoladamente o PostGIS e o Redis (memória da fila de corridas).
* Entre na pasta `services/api`.
* Rode `npm run build`. Ele gerará a pasta `dist` blindada e minificada.
* Suba a API globalmente com `pm2 start dist/main.js --name "Mobi_Global_API"`.
* Configure o Domínio no Nginx e um Certificado SSL (A Vercel não permite que seu Admin chame a API se não houver um lindo cadeadinho HTTPS!).

## 3. Os Aplicativos de Celular (APK para Android / IPA para iPhone)
Nesta atualização, eu já injetei no código dos 2 apps as engrenagens finais automáticas chamadas de "EAS Build" (Você notará um novo arquivo `.json` escondido neles, focado unicamente na compilação do Android e Apple).

Para obter o aplicativo físico `.APK` instalável na mão:
* Abra o seu computador, no terminal digite `npm install -g eas-cli`, logando na conta da Expo (`eas login`).
* Para compilar o app do Passageiro:
  1. Entre na pasta: `cd apps/customer`
  2. Rode o comando mágico: `eas build -p android --profile production`
  3. Você vai acompanhar a linha do tempo e receberá instantaneamente um Link (pra baixar no seu disco) do Arquivo Fonte instalável em qualquer Android.
* Para compilar o Motorista:
  1. `cd apps/driver` 
  2. E repita o mesmo comando, que gerará o app escuro focado neles!

## Conclusão
Qualquer edição de código adicional agora deverá ser feita testando a API no Terminal (localhost) primeiro, e só após homologado, empurrar (git push) para essas máquinas de produção!
