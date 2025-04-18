const amqp = require("amqplib");
const message = "New  Product: Title......";

// const log = console.log;
// console.log = function () {
//   log.apply(console, [new Date()].concat(arguments));
// };

const runProducer = async () => {
  try {
    const connection = await amqp.connect(
      "amqp://guest:Mwshwmf070804@localhost"
    );
    const channel = await connection.createChannel();

    // nghiep vu DLX
    const notificationExchange = "notificationEx"; // notificationEx direct
    const notiQueue = "notificationQueueProcess"; // assertQueue
    const notificationExchangeDLX = "notificationExDLX"; // notificationExDLX direct
    const notificationRoutingKeyDLX = "notificationRoutingKeyDLX"; // notificationExDLX direct

    // 1. Create Exchange
    await channel.assertExchange(notificationExchange, "direct", {
      durable: true,
    });

    // 2. Create Queue
    const queueResult = await channel.assertQueue(notiQueue, {
      exclusive: false, //Cho phep cac ket noi truy cap vao cung mot luc hang doi
      deadLetterExchange: notificationExchangeDLX,
      deadLetterRoutingKey: notificationRoutingKeyDLX,
    });

    // 3. bindQueue
    await channel.bindQueue(queueResult.queue, notificationExchange);

    // 4. send Message
    const msg = "New Product: Title 2: .....";
    console.log(`producer msg:::: `, msg);

    await channel.sendToQueue(queueResult.queue, Buffer.from(msg), {
      expiration: 5000,
    });

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error(error);
  }
};

runProducer().catch(console.error);
