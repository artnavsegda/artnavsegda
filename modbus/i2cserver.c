#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <fcntl.h>
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
	mb_mapping->tab_registers[100] = i2c_smbus_read_word_data(fd,0x00);
	mb_mapping->tab_registers[101] = i2c_smbus_read_word_data(fd,0x01);
	mb_mapping->tab_registers[102] = i2c_smbus_read_word_data(fd,0x02);
	mb_mapping->tab_registers[103] = i2c_smbus_read_word_data(fd,0x03);
	mb_mapping->tab_registers[104] = i2c_smbus_read_word_data(fd,0x04);
	mb_mapping->tab_registers[105] = i2c_smbus_read_word_data(fd,0x05);
	mb_mapping->tab_registers[106] = i2c_smbus_read_word_data(fd,0x06);
	mb_mapping->tab_registers[107] = i2c_smbus_read_word_data(fd,0x07);
	mb_mapping->tab_registers[108] = i2c_smbus_read_word_data(fd,0x08);
	mb_mapping->tab_registers[109] = i2c_smbus_read_word_data(fd,0x09);
	mb_mapping->tab_bits[100] = pca9557_get_pin_level(fd,0x00,PCA9557_IO0);
	mb_mapping->tab_bits[101] = pca9557_get_pin_level(fd,0x00,PCA9557_IO1);
	mb_mapping->tab_bits[102] = pca9557_get_pin_level(fd,0x00,PCA9557_IO2);
	mb_mapping->tab_bits[103] = pca9557_get_pin_level(fd,0x00,PCA9557_IO3);
	mb_mapping->tab_bits[104] = pca9557_get_pin_level(fd,0x00,PCA9557_IO4);
	mb_mapping->tab_bits[105] = pca9557_get_pin_level(fd,0x00,PCA9557_IO5);
	mb_mapping->tab_bits[106] = pca9557_get_pin_level(fd,0x00,PCA9557_IO6);
	mb_mapping->tab_bits[107] = pca9557_get_pin_level(fd,0x00,PCA9557_IO7);
	mb_mapping->tab_bits[108] = pca9557_get_pin_level(fd,0x01,PCA9557_IO0);
	mb_mapping->tab_bits[109] = pca9557_get_pin_level(fd,0x01,PCA9557_IO1);
	mb_mapping->tab_bits[110] = pca9557_get_pin_level(fd,0x01,PCA9557_IO2);
	mb_mapping->tab_bits[111] = pca9557_get_pin_level(fd,0x01,PCA9557_IO3);
	mb_mapping->tab_bits[112] = pca9557_get_pin_level(fd,0x01,PCA9557_IO4);
	mb_mapping->tab_bits[113] = pca9557_get_pin_level(fd,0x01,PCA9557_IO5);
	mb_mapping->tab_bits[114] = pca9557_get_pin_level(fd,0x01,PCA9557_IO6);
	mb_mapping->tab_bits[115] = pca9557_get_pin_level(fd,0x01,PCA9557_IO7);
	mb_mapping->tab_bits[116] = pca9557_get_pin_level(fd,0x02,PCA9557_IO0);
	mb_mapping->tab_bits[117] = pca9557_get_pin_level(fd,0x02,PCA9557_IO1);
	mb_mapping->tab_bits[118] = pca9557_get_pin_level(fd,0x02,PCA9557_IO2);
	mb_mapping->tab_bits[119] = pca9557_get_pin_level(fd,0x02,PCA9557_IO3);
	mb_mapping->tab_bits[120] = pca9557_get_pin_level(fd,0x02,PCA9557_IO4);
	mb_mapping->tab_bits[121] = pca9557_get_pin_level(fd,0x02,PCA9557_IO5);
	mb_mapping->tab_bits[122] = pca9557_get_pin_level(fd,0x02,PCA9557_IO6);
	mb_mapping->tab_bits[123] = pca9557_get_pin_level(fd,0x02,PCA9557_IO7);

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
