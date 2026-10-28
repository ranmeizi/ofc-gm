
/**
 * server 负责接收 client 的连接，并实现状态同步。
 *
 * 手动交换信令时，server 通常是被动方：
 * 接受 client 传来的 sdp，再把 answer 发回 client。
 * 信令交换在外侧完成，peer connect 后再 join 进 Room。
 */
class Server {
  
}

export default Server
