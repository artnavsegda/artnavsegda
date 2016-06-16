#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <errno.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>
#include <modbus.h>

int main(void)
{
    int socket, fd;
    modbus_t *ctx;
    modbus_mapping_t *mb_mapping;

    fd = open("/dev/i2c-1",O_RDWR);


	if (fd<=1)
	{
		printf("error on device\n");
		exit(1);
	}
	int addr = 0x09;
	if (ioctl(fd,I2C_SLAVE,addr) < 0)
	{
		printf("ioctl error\n");
		exit(1);
	}

    ctx = modbus_new_tcp("127.0.0.1", 1502);
    /* modbus_set_debug(ctx, TRUE); */

    mb_mapping = modbus_mapping_new(500, 500, 500, 500);
    if (mb_mapping == NULL) {
        fprintf(stderr, "Failed to allocate the mapping: %s\n",
                modbus_strerror(errno));
        modbus_free(ctx);
        return -1;
    }

    socket = modbus_tcp_listen(ctx, 1);
    modbus_tcp_accept(ctx, &socket);

    for (;;) {
        uint8_t query[MODBUS_TCP_MAX_ADU_LENGTH];
        int rc;
	mb_mapping->tab_input_registers[0] = 0x16;
	mb_mapping->tab_registers[100] = i2c_smbus_read_word_data(fd,0x0);

        rc = modbus_receive(ctx, query);
        if (rc != -1) {
            /* rc is the query size */
            modbus_reply(ctx, query, rc, mb_mapping);
        } else {
            /* Connection closed by the client or error */
            break;
        }
    }

    printf("Quit the loop: %s\n", modbus_strerror(errno));

    modbus_mapping_free(mb_mapping);
    modbus_close(ctx);
    modbus_free(ctx);

    return 0;
}
